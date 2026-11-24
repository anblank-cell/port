using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class PageDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? HtmlContent { get; set; }
        public string? CssContent { get; set; }
        public string Status { get; set; } = "draft";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreatePageDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Slug { get; set; } = string.Empty;

        public string Status { get; set; } = "draft";
    }

    public class UpdatePageDto
    {
        [MaxLength(200)]
        public string? Title { get; set; }

        [MaxLength(200)]
        public string? Slug { get; set; }

        public string? HtmlContent { get; set; }
        public string? CssContent { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; }
    }
}
