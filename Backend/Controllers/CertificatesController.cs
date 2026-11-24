using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CertificatesController : ControllerBase
    {
        private readonly IRepository<Certificate> _repository;

        public CertificatesController(IRepository<Certificate> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<CertificateDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities
                .OrderBy(e => e.Order)
                .ThenByDescending(e => e.IssueDate)
                .Select(e => new CertificateDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    IssuingOrganization = e.IssuingOrganization,
                    IssueDate = e.IssueDate,
                    CredentialUrl = e.CredentialUrl,
                    CredentialId = e.CredentialId,
                    ImageUrl = e.ImageUrl,
                    Order = e.Order
                });

            return Ok(ApiResponse<IEnumerable<CertificateDto>>.SuccessResponse(dtos));
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<CertificateDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<CertificateDto>.FailureResponse("Certificate not found"));

            var dto = new CertificateDto
            {
                Id = entity.Id,
                Name = entity.Name,
                IssuingOrganization = entity.IssuingOrganization,
                IssueDate = entity.IssueDate,
                CredentialUrl = entity.CredentialUrl,
                CredentialId = entity.CredentialId,
                ImageUrl = entity.ImageUrl,
                Order = entity.Order
            };

            return Ok(ApiResponse<CertificateDto>.SuccessResponse(dto));
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<CertificateDto>>> Create([FromBody] CreateCertificateDto dto)
        {
            var entity = new Certificate
            {
                Name = dto.Name,
                IssuingOrganization = dto.IssuingOrganization,
                IssueDate = dto.IssueDate,
                CredentialUrl = dto.CredentialUrl,
                CredentialId = dto.CredentialId,
                ImageUrl = dto.ImageUrl,
                Order = dto.Order
            };

            var created = await _repository.AddAsync(entity);

            var resultDto = new CertificateDto
            {
                Id = created.Id,
                Name = created.Name,
                IssuingOrganization = created.IssuingOrganization,
                IssueDate = created.IssueDate,
                CredentialUrl = created.CredentialUrl,
                CredentialId = created.CredentialId,
                ImageUrl = created.ImageUrl,
                Order = created.Order
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<CertificateDto>.SuccessResponse(resultDto, "Certificate created successfully"));
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<CertificateDto>>> Update(Guid id, [FromBody] UpdateCertificateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<CertificateDto>.FailureResponse("Certificate not found"));

            entity.Name = dto.Name;
            entity.IssuingOrganization = dto.IssuingOrganization;
            entity.IssueDate = dto.IssueDate;
            entity.CredentialUrl = dto.CredentialUrl;
            entity.CredentialId = dto.CredentialId;
            entity.ImageUrl = dto.ImageUrl;
            entity.Order = dto.Order;

            await _repository.UpdateAsync(entity);

            var resultDto = new CertificateDto
            {
                Id = entity.Id,
                Name = entity.Name,
                IssuingOrganization = entity.IssuingOrganization,
                IssueDate = entity.IssueDate,
                CredentialUrl = entity.CredentialUrl,
                CredentialId = entity.CredentialId,
                ImageUrl = entity.ImageUrl,
                Order = entity.Order
            };

            return Ok(ApiResponse<CertificateDto>.SuccessResponse(resultDto, "Certificate updated successfully"));
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Certificate not found"));

            await _repository.DeleteAsync(entity);

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Certificate deleted successfully"));
        }
    }
}
