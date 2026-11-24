using System;
using Backend.Entities;

namespace Backend.Authentication
{
    /// <summary>
    /// Service interface responsible for generating secure JWT tokens.
    /// </summary>
    public interface IJwtTokenGenerator
    {
        /// <summary>
        /// Generates a cryptographically signed JWT token for the specified user.
        /// </summary>
        /// <param name="user">The user entity to include claims for.</param>
        /// <returns>A tuple containing the serialized JWT string and its expiration timestamp in UTC.</returns>
        (string Token, DateTime Expiration) GenerateToken(User user);
    }
}
