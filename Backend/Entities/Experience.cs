using System;

namespace Backend.Entities
{
    /// <summary>
    /// Represents a professional work experience record displayed in the experience timeline.
    /// </summary>
    public class Experience : BaseEntity
    {
        /// <summary>Gets or sets the name of the employer company.</summary>
        public string CompanyName { get; set; } = string.Empty;

        /// <summary>Gets or sets the job title or role held.</summary>
        public string Role { get; set; } = string.Empty;

        /// <summary>Gets or sets the optional work location (city, country, or "Remote").</summary>
        public string? Location { get; set; }

        /// <summary>Gets or sets a description of responsibilities and achievements.</summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>Gets or sets the start date of the position in UTC.</summary>
        public DateTime StartDate { get; set; }

        /// <summary>Gets or sets the end date of the position. Null if currently employed.</summary>
        public DateTime? EndDate { get; set; }

        /// <summary>Gets or sets whether this is the current active position.</summary>
        public bool IsCurrent { get; set; } = false;

        /// <summary>Gets or sets the display ordering index.</summary>
        public int Order { get; set; } = 0;
    }
}
