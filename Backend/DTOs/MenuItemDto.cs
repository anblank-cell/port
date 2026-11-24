using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object representing a navigation menu link with hierarchy support.
    /// </summary>
    public class MenuItemDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public int Order { get; set; }
        public bool IsVisible { get; set; }
        public bool IsExternal { get; set; }
        public Guid? ParentId { get; set; }
        public List<MenuItemDto> Children { get; set; } = new();
    }

    /// <summary>
    /// Data transfer object for creating a new menu item.
    /// </summary>
    public class CreateMenuItemDto
    {
        [Required(ErrorMessage = "Title is required")]
        [StringLength(100, ErrorMessage = "Title cannot exceed 100 characters")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "URL or section anchor is required")]
        [StringLength(500, ErrorMessage = "URL cannot exceed 500 characters")]
        public string Url { get; set; } = string.Empty;

        public int Order { get; set; } = 1;
        public bool IsVisible { get; set; } = true;
        public bool IsExternal { get; set; } = false;
        public Guid? ParentId { get; set; }
    }

    /// <summary>
    /// Data transfer object for updating an existing menu item.
    /// </summary>
    public class UpdateMenuItemDto
    {
        [Required(ErrorMessage = "Title is required")]
        [StringLength(100, ErrorMessage = "Title cannot exceed 100 characters")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "URL or section anchor is required")]
        [StringLength(500, ErrorMessage = "URL cannot exceed 500 characters")]
        public string Url { get; set; } = string.Empty;

        public int Order { get; set; } = 1;
        public bool IsVisible { get; set; } = true;
        public bool IsExternal { get; set; } = false;
        public Guid? ParentId { get; set; }
    }
}
