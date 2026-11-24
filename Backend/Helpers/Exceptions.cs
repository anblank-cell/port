using System;

namespace Backend.Helpers
{
    /// <summary>
    /// Exception thrown when a requested resource is not found in the system.
    /// </summary>
    public class NotFoundException : Exception
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="NotFoundException"/> class.
        /// </summary>
        /// <param name="message">The message explaining the error.</param>
        public NotFoundException(string message) : base(message)
        {
        }
    }

    /// <summary>
    /// Exception thrown when a client request contains bad or invalid parameters.
    /// </summary>
    public class BadRequestException : Exception
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="BadRequestException"/> class.
        /// </summary>
        /// <param name="message">The message explaining the error.</param>
        public BadRequestException(string message) : base(message)
        {
        }
    }

    /// <summary>
    /// Exception thrown when authentication fails or is missing.
    /// </summary>
    public class UnauthorizedException : Exception
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="UnauthorizedException"/> class.
        /// </summary>
        /// <param name="message">The message explaining the error.</param>
        public UnauthorizedException(string message) : base(message)
        {
        }
    }

    /// <summary>
    /// Exception thrown when an authenticated user does not have permissions to access a resource.
    /// </summary>
    public class ForbiddenException : Exception
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="ForbiddenException"/> class.
        /// </summary>
        /// <param name="message">The message explaining the error.</param>
        public ForbiddenException(string message) : base(message)
        {
        }
    }
}
