using System.ComponentModel.DataAnnotations;

namespace Backend.Entities
{
    public class Page : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Slug { get; set; } = string.Empty;

        public string? HtmlContent { get; set; }
        public string? CssContent { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "draft"; // e.g. "published", "draft"
    }
}
