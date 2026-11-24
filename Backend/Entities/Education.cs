using System;

namespace Backend.Entities
{
    /// <summary>
    /// Represents a formal education or academic qualification record.
    /// </summary>
    public class Education : BaseEntity
    {
        /// <summary>Gets or sets the name of the educational institution.</summary>
        public string InstitutionName { get; set; } = string.Empty;

        /// <summary>Gets or sets the degree or qualification obtained (e.g. "Bachelor of Science").</summary>
        public string Degree { get; set; } = string.Empty;

        /// <summary>Gets or sets the optional field of study or major.</summary>
        public string? FieldOfStudy { get; set; }

        /// <summary>Gets or sets a description of the program or academic achievements.</summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>Gets or sets the enrollment start date in UTC.</summary>
        public DateTime StartDate { get; set; }

        /// <summary>Gets or sets the graduation or completion date. Null if still enrolled.</summary>
        public DateTime? EndDate { get; set; }

        /// <summary>Gets or sets whether this is the current active enrollment.</summary>
        public bool IsCurrent { get; set; } = false;

        /// <summary>Gets or sets the display ordering index.</summary>
        public int Order { get; set; } = 0;
    }
}
