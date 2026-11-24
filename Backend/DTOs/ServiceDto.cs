namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object for Service operations.
    /// </summary>
    public class ServiceDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Order { get; set; }
    }

    /// <summary>
    /// Create DTO for Service (without Id).
    /// </summary>
    public class CreateServiceDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Order { get; set; } = 0;
    }

    /// <summary>
    /// Update DTO for Service.
    /// </summary>
    public class UpdateServiceDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int Order { get; set; }
    }
}
