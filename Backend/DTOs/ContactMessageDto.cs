namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object for Contact Message operations.
    /// </summary>
    public class ContactMessageDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Subject { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Create DTO for Contact Message (without Id).
    /// This is used by the public contact form.
    /// </summary>
    public class CreateContactMessageDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Subject { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Update DTO for Contact Message (admin use - mark as read).
    /// </summary>
    public class UpdateContactMessageDto
    {
        public bool IsRead { get; set; }
    }
}
