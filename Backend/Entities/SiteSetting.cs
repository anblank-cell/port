namespace Backend.Entities
{
    /// <summary>
    /// Represents a generic configurable application setting stored as a key-value pair.
    /// Used to drive dynamic site configuration (site name, tagline, contact email, etc.)
    /// without requiring code changes.
    /// </summary>
    public class SiteSetting : BaseEntity
    {
        /// <summary>Gets or sets the unique configuration key identifier.</summary>
        public string Key { get; set; } = string.Empty;

        /// <summary>Gets or sets the setting value.</summary>
        public string Value { get; set; } = string.Empty;
    }
}
