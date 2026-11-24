namespace Backend.DTOs
{
    /// <summary>
    /// Data transfer object for Certificate operations.
    /// </summary>
    public class CertificateDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string IssuingOrganization { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public string? CredentialUrl { get; set; }
        public string? CredentialId { get; set; }
        public string? ImageUrl { get; set; }
        public int Order { get; set; }
    }

    /// <summary>
    /// Create DTO for Certificate (without Id).
    /// </summary>
    public class CreateCertificateDto
    {
        public string Name { get; set; } = string.Empty;
        public string IssuingOrganization { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public string? CredentialUrl { get; set; }
        public string? CredentialId { get; set; }
        public string? ImageUrl { get; set; }
        public int Order { get; set; } = 0;
    }

    /// <summary>
    /// Update DTO for Certificate.
    /// </summary>
    public class UpdateCertificateDto
    {
        public string Name { get; set; } = string.Empty;
        public string IssuingOrganization { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public string? CredentialUrl { get; set; }
        public string? CredentialId { get; set; }
        public string? ImageUrl { get; set; }
        public int Order { get; set; }
    }
}
