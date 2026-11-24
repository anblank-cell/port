using System.Collections.Generic;

namespace Backend.Entities
{
    /// <summary>
    /// Represents an authenticated system administrator user.
    /// </summary>
    public class User : BaseEntity
    {
        /// <summary>
        /// Gets or sets the full name of the user.
        /// </summary>
        public string FullName { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the unique email address used as login credential.
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the cryptographically hashed password.
        /// </summary>
        public string PasswordHash { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the access control role (e.g. Admin).
        /// </summary>
        public string Role { get; set; } = "Admin";

        /// <summary>
        /// Gets or sets the collection of active refresh tokens associated with this user.
        /// </summary>
        public List<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}
