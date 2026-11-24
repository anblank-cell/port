using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Backend.Configurations;
using Backend.DTOs;
using Backend.Interfaces;
using Backend.Models;

namespace Backend.Controllers
{
    /// <summary>
    /// API Controller exposing endpoints for administrator login, token rotation, and sign-out/revocation.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly JwtSettings _jwtSettings;

        /// <summary>
        /// Initializes a new instance of the <see cref="AuthController"/> class.
        /// </summary>
        /// <param name="authService">The authentication business logic service.</param>
        /// <param name="jwtOptions">The configuration options mapped to JWT settings.</param>
        public AuthController(IAuthService authService, IOptions<JwtSettings> jwtOptions)
        {
            _authService = authService ?? throw new ArgumentNullException(nameof(authService));
            _jwtSettings = jwtOptions?.Value ?? throw new ArgumentNullException(nameof(jwtOptions));
        }

        /// <summary>
        /// Authenticates administrator credentials and registers a secure browser refresh cookie.
        /// </summary>
        /// <param name="request">The login credentials payload.</param>
        /// <returns>A standardized API response containing user info and access tokens.</returns>
        [HttpPost("login")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ApiResponse<LoginResponse>))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized, Type = typeof(ApiResponse<object>))]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.LoginAsync(request, GetIpAddress());
            SetRefreshTokenCookie(result.RefreshToken);
            return Ok(ApiResponse<LoginResponse>.SuccessResponse(result.Response, "Login completed successfully."));
        }

        /// <summary>
        /// Rotates the active browser session, verifying the refresh cookie and returning refreshed tokens.
        /// </summary>
        /// <returns>The refreshed user credentials details.</returns>
        [HttpPost("refresh")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ApiResponse<LoginResponse>))]
        [ProducesResponseType(StatusCodes.Status401Unauthorized, Type = typeof(ApiResponse<object>))]
        public async Task<IActionResult> Refresh()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
            {
                return Unauthorized(ApiResponse<object>.FailureResponse("Session refresh token is missing."));
            }

            var result = await _authService.RefreshTokenAsync(refreshToken, GetIpAddress());
            SetRefreshTokenCookie(result.RefreshToken);
            return Ok(ApiResponse<LoginResponse>.SuccessResponse(result.Response, "Session tokens refreshed successfully."));
        }

        /// <summary>
        /// Revokes the current refresh token and clears active session cookies, logging out the administrator.
        /// </summary>
        /// <returns>A confirmation of successful revocation.</returns>
        [HttpPost("revoke")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ApiResponse<string>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest, Type = typeof(ApiResponse<object>))]
        public async Task<IActionResult> Revoke()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
            {
                return BadRequest(ApiResponse<object>.FailureResponse("No active session token to revoke."));
            }

            await _authService.RevokeTokenAsync(refreshToken, GetIpAddress());
            Response.Cookies.Delete("refreshToken");
            return Ok(ApiResponse<string>.SuccessResponse("Session tokens revoked successfully."));
        }

        /// <summary>
        /// Sets the rotated refresh token in a secure, HttpOnly cookie restricted to auth paths.
        /// </summary>
        private void SetRefreshTokenCookie(string refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Require HTTPS transmission
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays),
                Path = "/api/auth" // Limit cookies transmission scope
            };
            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }

        /// <summary>
        /// Extracts client IP address parsing forward proxies headers if present.
        /// </summary>
        private string GetIpAddress()
        {
            if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedHeader))
            {
                var ip = forwardedHeader.FirstOrDefault();
                if (!string.IsNullOrEmpty(ip)) return ip;
            }
            return HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? string.Empty;
        }
    }
}
