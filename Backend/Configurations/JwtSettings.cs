namespace Backend.Configurations
{
    /// <summary>
    /// Configuration settings model mapped to the 'JwtSettings' section in application settings.
    /// </summary>
    public class JwtSettings
    {
        /// <summary>
        /// Gets or sets the security key used to sign the symmetric key algorithms of the JWT access tokens.
        /// </summary>
        public string Secret { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the expected issuer of the JWT access tokens.
        /// </summary>
        public string Issuer { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the expected audience of the JWT access tokens.
        /// </summary>
        public string Audience { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the duration in minutes for which the JWT access token remains valid.
        /// </summary>
        public int ExpiryMinutes { get; set; } = 15;

        /// <summary>
        /// Gets or sets the duration in days for which the refresh token remains valid.
        /// </summary>
        public int RefreshTokenExpiryDays { get; set; } = 7;
    }
}
