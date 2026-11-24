namespace Backend.Entities
{
    /// <summary>
    /// Represents a social media or professional network link displayed in the footer and contact section.
    /// </summary>
    public class SocialLink : BaseEntity
    {
        /// <summary>Gets or sets the platform name (e.g. "GitHub", "LinkedIn", "Twitter").</summary>
        public string PlatformName { get; set; } = string.Empty;

        /// <summary>Gets or sets the full profile URL.</summary>
        public string Url { get; set; } = string.Empty;

        /// <summary>Gets or sets the icon identifier (e.g. SVG path, icon class, or emoji).</summary>
        public string Icon { get; set; } = string.Empty;

        /// <summary>Gets or sets the display ordering index.</summary>
        public int Order { get; set; } = 0;
    }
}
