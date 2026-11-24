namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object for Education operations.
    /// </summary>
    public class EducationDto
    {
        public Guid Id { get; set; }
        public string InstitutionName { get; set; } = string.Empty;
        public string Degree { get; set; } = string.Empty;
        public string? FieldOfStudy { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsCurrent { get; set; }
        public int Order { get; set; }
    }

    /// <summary>
    /// Create DTO for Education (without Id).
    /// </summary>
    public class CreateEducationDto
    {
        public string InstitutionName { get; set; } = string.Empty;
        public string Degree { get; set; } = string.Empty;
        public string? FieldOfStudy { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsCurrent { get; set; } = false;
        public int Order { get; set; } = 0;
    }

    /// <summary>
    /// Update DTO for Education.
    /// </summary>
    public class UpdateEducationDto
    {
        public string InstitutionName { get; set; } = string.Empty;
        public string Degree { get; set; } = string.Empty;
        public string? FieldOfStudy { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsCurrent { get; set; }
        public int Order { get; set; }
    }
}
