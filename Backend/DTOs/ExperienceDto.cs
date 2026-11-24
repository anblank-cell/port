namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object for Experience operations.
    /// </summary>
    public class ExperienceDto
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsCurrent { get; set; }
        public int Order { get; set; }
    }

    /// <summary>
    /// Create DTO for Experience (without Id).
    /// </summary>
    public class CreateExperienceDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsCurrent { get; set; } = false;
        public int Order { get; set; } = 0;
    }

    /// <summary>
    /// Update DTO for Experience.
    /// </summary>
    public class UpdateExperienceDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsCurrent { get; set; }
        public int Order { get; set; }
    }
}
