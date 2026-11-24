namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object for Statistic operations.
    /// </summary>
    public class StatisticDto
    {
        public Guid Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Order { get; set; }
    }

    /// <summary>
    /// Create DTO for Statistic (without Id).
    /// </summary>
    public class CreateStatisticDto
    {
        public string Label { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Order { get; set; } = 0;
    }

    /// <summary>
    /// Update DTO for Statistic.
    /// </summary>
    public class UpdateStatisticDto
    {
        public string Label { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Order { get; set; }
    }
}
