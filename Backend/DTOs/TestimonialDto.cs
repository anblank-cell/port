namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object for Testimonial operations.
    /// </summary>
    public class TestimonialDto
    {
        public Guid Id { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public string ClientRole { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public string? ClientImageUrl { get; set; }
        public int Order { get; set; }
    }

    /// <summary>
    /// Create DTO for Testimonial (without Id).
    /// </summary>
    public class CreateTestimonialDto
    {
        public string ClientName { get; set; } = string.Empty;
        public string ClientRole { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public string? ClientImageUrl { get; set; }
        public int Order { get; set; } = 0;
    }

    /// <summary>
    /// Update DTO for Testimonial.
    /// </summary>
    public class UpdateTestimonialDto
    {
        public string ClientName { get; set; } = string.Empty;
        public string ClientRole { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public string? ClientImageUrl { get; set; }
        public int Order { get; set; }
    }
}
