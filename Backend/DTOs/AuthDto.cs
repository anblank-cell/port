using System;

namespace Backend.DTOs
{
    /// <summary>
    /// Represents the request details submitted when an admin attempts to log in.
    /// </summary>
    public class LoginRequest
    {
        /// <summary>
        /// Gets or sets the email address.
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the raw password.
        /// </summary>
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// Represents the authentication credentials returned upon successful validation.
    /// </summary>
    public class LoginResponse
    {
        /// <summary>
        /// Gets or sets the JWT access token.
        /// </summary>
        public string AccessToken { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the user's full name.
        /// </summary>
        public string FullName { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the user's email address.
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the expiration timestamp of the access token in UTC.
        /// </summary>
        public DateTime AccessTokenExpiration { get; set; }
    }
}
