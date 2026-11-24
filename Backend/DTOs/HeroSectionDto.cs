namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object for Hero Section operations.
    /// </summary>
    public class HeroSectionDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ProfileImageUrl { get; set; } = string.Empty;
        public string ResumeUrl { get; set; } = string.Empty;
        public bool IsVisible { get; set; }
    }

    /// <summary>
    /// Create DTO for Hero Section (without Id).
    /// </summary>
    public class CreateHeroSectionDto
    {
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ProfileImageUrl { get; set; } = string.Empty;
        public string ResumeUrl { get; set; } = string.Empty;
        public bool IsVisible { get; set; } = true;
    }

    /// <summary>
    /// Update DTO for Hero Section.
    /// </summary>
    public class UpdateHeroSectionDto
    {
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ProfileImageUrl { get; set; } = string.Empty;
        public string ResumeUrl { get; set; } = string.Empty;
        public bool IsVisible { get; set; }
    }
}
