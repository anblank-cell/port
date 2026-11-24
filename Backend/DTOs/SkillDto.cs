namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object for Skill operations.
    /// </summary>
    public class SkillDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int ProficiencyPercentage { get; set; }
        public string? Icon { get; set; }
        public int Order { get; set; }
    }

    /// <summary>
    /// Create DTO for Skill (without Id).
    /// </summary>
    public class CreateSkillDto
    {
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int ProficiencyPercentage { get; set; }
        public string? Icon { get; set; }
        public int Order { get; set; } = 0;
    }

    /// <summary>
    /// Update DTO for Skill.
    /// </summary>
    public class UpdateSkillDto
    {
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int ProficiencyPercentage { get; set; }
        public string? Icon { get; set; }
        public int Order { get; set; }
    }
}
