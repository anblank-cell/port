using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities
{
    /// <summary>
    /// Represents a navigation menu link item for a navigation menu.
    /// Supports hierarchical parent-child dropdown nesting.
    /// </summary>
    public class MenuItem : BaseEntity
    {
        /// <summary>
        /// Gets or sets the Foreign Key ID of the parent Menu container.
        /// </summary>
        public Guid? MenuId { get; set; }

        /// <summary>
        /// Gets or sets the parent Menu navigation property.
        /// </summary>
        [ForeignKey(nameof(MenuId))]
        public virtual Menu? Menu { get; set; }

        /// <summary>
        /// Gets or sets the displayed text title of the navigation item (e.g. "Home", "Projects", "Custom Blog").
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the target URL or section anchor (e.g. "#hero", "#projects", "https://example.com").
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string Url { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the display order weight.
        /// </summary>
        public int Order { get; set; } = 1;

        /// <summary>
        /// Gets or sets a value indicating whether the menu link is visible.
        /// </summary>
        public bool IsVisible { get; set; } = true;

        /// <summary>
        /// Gets or sets a value indicating whether the link opens in a new tab (_blank).
        /// </summary>
        public bool IsExternal { get; set; } = false;

        /// <summary>
        /// Gets or sets the optional parent menu item ID for hierarchical nested submenu items.
        /// </summary>
        public Guid? ParentId { get; set; }
    }
}
