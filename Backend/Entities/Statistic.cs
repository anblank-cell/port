namespace Backend.Entities
{
    /// <summary>
    /// Represents a statistics counter item displayed in the hero or about section (e.g. "50+ Projects", "5 Years Experience").
    /// </summary>
    public class Statistic : BaseEntity
    {
        /// <summary>Gets or sets the statistic label (e.g. "Projects Completed").</summary>
        public string Label { get; set; } = string.Empty;

        /// <summary>Gets or sets the statistic value (e.g. "50+", "100").</summary>
        public string Value { get; set; } = string.Empty;

        /// <summary>Gets or sets the icon identifier for the statistic card.</summary>
        public string Icon { get; set; } = string.Empty;

        /// <summary>Gets or sets the display ordering index.</summary>
        public int Order { get; set; } = 0;
    }
}
