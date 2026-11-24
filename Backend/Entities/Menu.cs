using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.Entities
{
    /// <summary>
    /// Represents a distinct navigation menu container (e.g., Primary Navigation Menu, Footer Menu, Mobile Drawer).
    /// </summary>
    public class Menu : BaseEntity
    {
        /// <summary>
        /// Gets or sets the human-readable display name of the menu (e.g. "Primary Navigation Menu", "Footer Quick Links").
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the URL-friendly slug identifier for the menu (e.g. "primary-navigation", "footer-links").
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Slug { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the designated theme display location (e.g. "header", "footer", "secondary", or null).
        /// </summary>
        [MaxLength(50)]
        public string? Location { get; set; } = "header";

        /// <summary>
        /// Gets or sets a value indicating whether this menu is the active primary header navigation bar.
        /// </summary>
        public bool IsPrimary { get; set; } = true;

        /// <summary>
        /// Gets or sets the ordered hierarchical list of navigation items in this menu.
        /// </summary>
        public virtual ICollection<MenuItem> Items { get; set; } = new List<MenuItem>();
    }
}
