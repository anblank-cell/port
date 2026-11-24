namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object for Project operations.
    /// </summary>
    public class ProjectDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string? ProjectUrl { get; set; }
        public string? GithubUrl { get; set; }
        public string Technologies { get; set; } = string.Empty;
        public int Order { get; set; }
        public bool IsFeatured { get; set; }
        public string? CategoryTag { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Create DTO for Project (without Id).
    /// </summary>
    public class CreateProjectDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string? ProjectUrl { get; set; }
        public string? GithubUrl { get; set; }
        public string Technologies { get; set; } = string.Empty;
        public int Order { get; set; } = 0;
        public bool IsFeatured { get; set; } = false;
        public string? CategoryTag { get; set; }
    }

    /// <summary>
    /// Update DTO for Project.
    /// </summary>
    public class UpdateProjectDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string? ProjectUrl { get; set; }
        public string? GithubUrl { get; set; }
        public string Technologies { get; set; } = string.Empty;
        public int Order { get; set; }
        public bool IsFeatured { get; set; }
        public string? CategoryTag { get; set; }
    }
}
