namespace Backend.Entities
{
    /// <summary>
    /// Represents a client testimonial or recommendation displayed in the testimonials section.
    /// </summary>
    public class Testimonial : BaseEntity
    {
        /// <summary>Gets or sets the full name of the client providing the testimonial.</summary>
        public string ClientName { get; set; } = string.Empty;

        /// <summary>Gets or sets the job title or role of the client.</summary>
        public string ClientRole { get; set; } = string.Empty;

        /// <summary>Gets or sets the client's company name.</summary>
        public string? CompanyName { get; set; }

        /// <summary>Gets or sets the testimonial feedback text.</summary>
        public string Feedback { get; set; } = string.Empty;

        /// <summary>Gets or sets the URL of the client's profile photo.</summary>
        public string? ClientImageUrl { get; set; }

        /// <summary>Gets or sets the display ordering index.</summary>
        public int Order { get; set; } = 0;
    }
}
