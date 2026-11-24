namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object for Social Link operations.
    /// </summary>
    public class SocialLinkDto
    {
        public Guid Id { get; set; }
        public string PlatformName { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Order { get; set; }
    }

    /// <summary>
    /// Create DTO for Social Link (without Id).
    /// </summary>
    public class CreateSocialLinkDto
    {
        public string PlatformName { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Order { get; set; } = 0;
    }

    /// <summary>
    /// Update DTO for Social Link.
    /// </summary>
    public class UpdateSocialLinkDto
    {
        public string PlatformName { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Order { get; set; }
    }
}
