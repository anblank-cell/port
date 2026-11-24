using System;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Backend.Authentication;
using Backend.Configurations;
using Backend.DTOs;
using Backend.Entities;
using Backend.Helpers;
using Backend.Interfaces;

namespace Backend.Services
{
    /// <summary>
    /// Service executing user sign-in credentials checking, token generation, and secure session rotation.
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<RefreshToken> _refreshTokenRepository;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly JwtSettings _jwtSettings;

        /// <summary>
        /// Initializes a new instance of the <see cref="AuthService"/> class.
        /// </summary>
        /// <param name="userRepository">The user entity repository interface.</param>
        /// <param name="refreshTokenRepository">The refresh token repository interface.</param>
        /// <param name="jwtTokenGenerator">The JWT generation utility.</param>
        /// <param name="jwtOptions">The configuration options mapped to JWT settings.</param>
        public AuthService(
            IRepository<User> userRepository,
            IRepository<RefreshToken> refreshTokenRepository,
            IJwtTokenGenerator jwtTokenGenerator,
            IOptions<JwtSettings> jwtOptions)
        {
            _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
            _refreshTokenRepository = refreshTokenRepository ?? throw new ArgumentNullException(nameof(refreshTokenRepository));
            _jwtTokenGenerator = jwtTokenGenerator ?? throw new ArgumentNullException(nameof(jwtTokenGenerator));
            _jwtSettings = jwtOptions?.Value ?? throw new ArgumentNullException(nameof(jwtOptions));
        }

        /// <inheritdoc />
        public async Task<(LoginResponse Response, string RefreshToken)> LoginAsync(LoginRequest request, string ipAddress)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            var userList = await _userRepository.FindAsync(u => u.Email.ToLower() == request.Email.ToLower());
            var user = userList.FirstOrDefault();

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                throw new UnauthorizedException("Invalid email or password.");
            }

            var (accessToken, expiration) = _jwtTokenGenerator.GenerateToken(user);
            var refreshStr = GenerateRefreshTokenString();

            var newRefreshToken = new RefreshToken
            {
                Token = refreshStr,
                Expires = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays),
                CreatedByIp = ipAddress,
                UserId = user.Id
            };

            await _refreshTokenRepository.AddAsync(newRefreshToken);

            var response = new LoginResponse
            {
                AccessToken = accessToken,
                FullName = user.FullName,
                Email = user.Email,
                AccessTokenExpiration = expiration
            };

            return (response, refreshStr);
        }

        /// <inheritdoc />
        public async Task<(LoginResponse Response, string RefreshToken)> RefreshTokenAsync(string token, string ipAddress)
        {
            if (string.IsNullOrEmpty(token))
                throw new BadRequestException("Refresh token is required.");

            var tokenList = await _refreshTokenRepository.FindAsync(rt => rt.Token == token);
            var refreshToken = tokenList.FirstOrDefault();

            if (refreshToken == null || !refreshToken.IsActive)
            {
                throw new UnauthorizedException("Invalid refresh token.");
            }

            // Revoke the current refresh token
            refreshToken.Revoked = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;

            // Generate rotated replacement tokens
            var newRefreshStr = GenerateRefreshTokenString();
            var newRefreshToken = new RefreshToken
            {
                Token = newRefreshStr,
                Expires = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays),
                CreatedByIp = ipAddress,
                UserId = refreshToken.UserId
            };

            refreshToken.ReplacedByToken = newRefreshStr;

            // Update old and save new
            await _refreshTokenRepository.UpdateAsync(refreshToken);
            await _refreshTokenRepository.AddAsync(newRefreshToken);

            var user = await _userRepository.GetByIdAsync(refreshToken.UserId);
            if (user == null)
            {
                throw new NotFoundException("Associated user was not found.");
            }

            var (accessToken, expiration) = _jwtTokenGenerator.GenerateToken(user);

            var response = new LoginResponse
            {
                AccessToken = accessToken,
                FullName = user.FullName,
                Email = user.Email,
                AccessTokenExpiration = expiration
            };

            return (response, newRefreshStr);
        }

        /// <inheritdoc />
        public async Task RevokeTokenAsync(string token, string ipAddress)
        {
            if (string.IsNullOrEmpty(token))
                throw new BadRequestException("Refresh token is required.");

            var tokenList = await _refreshTokenRepository.FindAsync(rt => rt.Token == token);
            var refreshToken = tokenList.FirstOrDefault();

            if (refreshToken == null || !refreshToken.IsActive)
            {
                throw new BadRequestException("Token is invalid or already inactive.");
            }

            refreshToken.Revoked = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;

            await _refreshTokenRepository.UpdateAsync(refreshToken);
        }

        /// <summary>
        /// Generates a cryptographically strong random token string.
        /// </summary>
        private static string GenerateRefreshTokenString()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }
}
