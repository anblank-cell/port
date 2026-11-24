namespace Backend.Entities
{
    /// <summary>
    /// Represents a professional service offered, displayed in the services section.
    /// </summary>
    public class Service : BaseEntity
    {
        /// <summary>Gets or sets the service name.</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Gets or sets the service description.</summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>Gets or sets the icon identifier (e.g. emoji, icon class, or SVG path).</summary>
        public string Icon { get; set; } = string.Empty;

        /// <summary>Gets or sets the display ordering index.</summary>
        public int Order { get; set; } = 0;
    }
}
