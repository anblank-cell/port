namespace Backend.Entities
{
    /// <summary>
    /// Represents a portfolio project item displayed in the projects section.
    /// </summary>
    public class Project : BaseEntity
    {
        /// <summary>Gets or sets the project title.</summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>Gets or sets a detailed description of the project.</summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>Gets or sets the URL of the project showcase image.</summary>
        public string ImageUrl { get; set; } = string.Empty;

        /// <summary>Gets or sets the live deployment URL of the project.</summary>
        public string? ProjectUrl { get; set; }

        /// <summary>Gets or sets the GitHub source repository URL.</summary>
        public string? GithubUrl { get; set; }

        /// <summary>
        /// Gets or sets the technologies used, stored as a comma-separated string.
        /// Example: "ASP.NET Core, PostgreSQL, Vanilla JS"
        /// </summary>
        public string Technologies { get; set; } = string.Empty;

        /// <summary>Gets or sets the display ordering index (lower = higher priority).</summary>
        public int Order { get; set; } = 0;

        /// <summary>Gets or sets whether this project is highlighted in the featured section.</summary>
        public bool IsFeatured { get; set; } = false;

        /// <summary>Gets or sets an optional category tag (e.g. "Full Stack", "Frontend").</summary>
        public string? CategoryTag { get; set; }
    }
}
