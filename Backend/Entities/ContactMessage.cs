namespace Backend.Entities
{
    /// <summary>
    /// Represents an inbound contact message submitted through the portfolio contact form.
    /// These are managed in the admin panel inbox.
    /// </summary>
    public class ContactMessage : BaseEntity
    {
        /// <summary>Gets or sets the sender's full name.</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Gets or sets the sender's email address.</summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>Gets or sets the optional message subject line.</summary>
        public string? Subject { get; set; }

        /// <summary>Gets or sets the full message body.</summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>Gets or sets whether the admin has read this message.</summary>
        public bool IsRead { get; set; } = false;
    }
}
