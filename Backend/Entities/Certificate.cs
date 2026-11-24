using System;

namespace Backend.Entities
{
    /// <summary>
    /// Represents a professional certificate or credential obtained from an issuing organization.
    /// </summary>
    public class Certificate : BaseEntity
    {
        /// <summary>Gets or sets the name of the certification.</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Gets or sets the name of the organization that issued the certificate.</summary>
        public string IssuingOrganization { get; set; } = string.Empty;

        /// <summary>Gets or sets the date the certificate was issued in UTC.</summary>
        public DateTime IssueDate { get; set; }

        /// <summary>Gets or sets the verification URL of the credential.</summary>
        public string? CredentialUrl { get; set; }

        /// <summary>Gets or sets the unique credential ID provided by the issuing body.</summary>
        public string? CredentialId { get; set; }

        /// <summary>Gets or sets the URL of the certificate badge or preview image.</summary>
        public string? ImageUrl { get; set; }

        /// <summary>Gets or sets the display ordering index.</summary>
        public int Order { get; set; } = 0;
    }
}
