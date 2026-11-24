namespace Backend.Entities
{
    /// <summary>
    /// Represents the hero banner section of the public portfolio page.
    /// All fields are editable from the admin dashboard.
    /// </summary>
    public class HeroSection : BaseEntity
    {
        /// <summary>Gets or sets the primary headline title text.</summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>Gets or sets the secondary subtitle label.</summary>
        public string Subtitle { get; set; } = string.Empty;

        /// <summary>Gets or sets the descriptive paragraph body content.</summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>Gets or sets the URL of the hero profile photo.</summary>
        public string ProfileImageUrl { get; set; } = string.Empty;

        /// <summary>Gets or sets the downloadable resume file URL.</summary>
        public string ResumeUrl { get; set; } = string.Empty;

        /// <summary>Gets or sets whether the hero section is visible on the portfolio.</summary>
        public bool IsVisible { get; set; } = true;
    }
}
