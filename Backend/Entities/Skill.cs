namespace Backend.Entities
{
    /// <summary>
    /// Represents a technical skill with a proficiency rating, displayed in the skills section.
    /// </summary>
    public class Skill : BaseEntity
    {
        /// <summary>Gets or sets the skill name (e.g. "C#", "PostgreSQL").</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Gets or sets the category grouping (e.g. "Frontend", "Backend", "DevOps").</summary>
        public string Category { get; set; } = string.Empty;

        /// <summary>Gets or sets the proficiency percentage from 0 to 100.</summary>
        public int ProficiencyPercentage { get; set; } = 0;

        /// <summary>Gets or sets the icon identifier or URL.</summary>
        public string? Icon { get; set; }

        /// <summary>Gets or sets the display ordering index.</summary>
        public int Order { get; set; } = 0;
    }
}
