namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object for Site Setting operations.
    /// </summary>
    public class SiteSettingDto
    {
        public Guid Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    /// <summary>
    /// Create DTO for Site Setting (without Id).
    /// </summary>
    public class CreateSiteSettingDto
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    /// <summary>
    /// Update DTO for Site Setting.
    /// </summary>
    public class UpdateSiteSettingDto
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}
