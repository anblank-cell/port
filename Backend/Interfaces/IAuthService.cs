using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Interfaces
{
    /// <summary>
    /// Service interface handling login validation, refresh token validation, and revoking operations.
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Validates login credentials and returns signed tokens.
        /// </summary>
        /// <param name="request">The login request payload containing email and password.</param>
        /// <param name="ipAddress">The IP address of the client submitting the request.</param>
        /// <returns>A login response including access and refresh tokens.</returns>
        Task<(LoginResponse Response, string RefreshToken)> LoginAsync(LoginRequest request, string ipAddress);

        /// <summary>
        /// Rotates an active refresh token, generating a new access token and replacement refresh token.
        /// </summary>
        /// <param name="token">The existing active refresh token.</param>
        /// <param name="ipAddress">The IP address of the client submitting the request.</param>
        /// <returns>The rotated login credentials.</returns>
        Task<(LoginResponse Response, string RefreshToken)> RefreshTokenAsync(string token, string ipAddress);

        /// <summary>
        /// Explicitly revokes a refresh token, invalidating the session.
        /// </summary>
        /// <param name="token">The token string to revoke.</param>
        /// <param name="ipAddress">The IP address of the client submitting the request.</param>
        Task RevokeTokenAsync(string token, string ipAddress);
    }
}
