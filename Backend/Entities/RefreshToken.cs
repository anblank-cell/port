using System;

namespace Backend.Entities
{
    /// <summary>
    /// Represents a refresh token used in sliding session renewals to obtain a new JWT access token.
    /// </summary>
    public class RefreshToken : BaseEntity
    {
        /// <summary>
        /// Gets or sets the random cryptographically unique refresh token string.
        /// </summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the date and time when the token expires in UTC.
        /// </summary>
        public DateTime Expires { get; set; }

        /// <summary>
        /// Gets or sets the IP address of the client that created the token.
        /// </summary>
        public string CreatedByIp { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the date and time when the token was revoked in UTC.
        /// </summary>
        public DateTime? Revoked { get; set; }

        /// <summary>
        /// Gets or sets the IP address of the client that requested revocation of the token.
        /// </summary>
        public string? RevokedByIp { get; set; }

        /// <summary>
        /// Gets or sets the token string that replaced this token after rotation.
        /// </summary>
        public string? ReplacedByToken { get; set; }

        /// <summary>
        /// Gets or sets the foreign key reference of the associated user.
        /// </summary>
        public Guid UserId { get; set; }

        /// <summary>
        /// Gets or sets the navigation property to the associated user entity.
        /// </summary>
        public User? User { get; set; }

        /// <summary>
        /// Gets a value indicating whether the token is expired.
        /// </summary>
        public bool IsExpired => DateTime.UtcNow >= Expires;

        /// <summary>
        /// Gets a value indicating whether the token has been explicitly revoked.
        /// </summary>
        public bool IsRevoked => Revoked != null;

        /// <summary>
        /// Gets a value indicating whether the token is currently active and valid.
        /// </summary>
        public bool IsActive => !IsRevoked && !IsExpired;
    }
}
