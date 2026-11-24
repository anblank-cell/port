using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    /// <summary>
    /// Summary data transfer object for menu list dropdown.
    /// </summary>
    public class MenuSummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Location { get; set; }
        public bool IsPrimary { get; set; }
        public int ItemCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// Detailed data transfer object for a single menu with all hierarchical items.
    /// </summary>
    public class MenuDetailDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Location { get; set; }
        public bool IsPrimary { get; set; }
        public List<MenuItemDto> Items { get; set; } = new();
    }

    /// <summary>
    /// Data transfer object for creating a new menu.
    /// </summary>
    public class CreateMenuDto
    {
        [Required(ErrorMessage = "Menu Name is required")]
        [StringLength(100, ErrorMessage = "Menu Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(50, ErrorMessage = "Location cannot exceed 50 characters")]
        public string? Location { get; set; } = "header";

        public bool IsPrimary { get; set; } = false;
    }

    /// <summary>
    /// Data transfer object for updating menu metadata and location settings.
    /// </summary>
    public class UpdateMenuDto
    {
        [Required(ErrorMessage = "Menu Name is required")]
        [StringLength(100, ErrorMessage = "Menu Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(50, ErrorMessage = "Location cannot exceed 50 characters")]
        public string? Location { get; set; }

        public bool IsPrimary { get; set; }
    }
}
