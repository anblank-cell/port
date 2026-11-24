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
    public class EducationController : ControllerBase
    {
        private readonly IRepository<Education> _repository;

        public EducationController(IRepository<Education> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<EducationDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities
                .OrderBy(e => e.Order)
                .ThenByDescending(e => e.StartDate)
                .Select(e => new EducationDto
                {
                    Id = e.Id,
                    InstitutionName = e.InstitutionName,
                    Degree = e.Degree,
                    FieldOfStudy = e.FieldOfStudy,
                    Description = e.Description,
                    StartDate = e.StartDate,
                    EndDate = e.EndDate,
                    IsCurrent = e.IsCurrent,
                    Order = e.Order
                });

            return Ok(ApiResponse<IEnumerable<EducationDto>>.SuccessResponse(dtos));
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<EducationDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<EducationDto>.FailureResponse("Education not found"));

            var dto = new EducationDto
            {
                Id = entity.Id,
                InstitutionName = entity.InstitutionName,
                Degree = entity.Degree,
                FieldOfStudy = entity.FieldOfStudy,
                Description = entity.Description,
                StartDate = entity.StartDate,
                EndDate = entity.EndDate,
                IsCurrent = entity.IsCurrent,
                Order = entity.Order
            };

            return Ok(ApiResponse<EducationDto>.SuccessResponse(dto));
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<EducationDto>>> Create([FromBody] CreateEducationDto dto)
        {
            var entity = new Education
            {
                InstitutionName = dto.InstitutionName,
                Degree = dto.Degree,
                FieldOfStudy = dto.FieldOfStudy,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsCurrent = dto.IsCurrent,
                Order = dto.Order
            };

            var created = await _repository.AddAsync(entity);

            var resultDto = new EducationDto
            {
                Id = created.Id,
                InstitutionName = created.InstitutionName,
                Degree = created.Degree,
                FieldOfStudy = created.FieldOfStudy,
                Description = created.Description,
                StartDate = created.StartDate,
                EndDate = created.EndDate,
                IsCurrent = created.IsCurrent,
                Order = created.Order
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<EducationDto>.SuccessResponse(resultDto, "Education created successfully"));
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<EducationDto>>> Update(Guid id, [FromBody] UpdateEducationDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<EducationDto>.FailureResponse("Education not found"));

            entity.InstitutionName = dto.InstitutionName;
            entity.Degree = dto.Degree;
            entity.FieldOfStudy = dto.FieldOfStudy;
            entity.Description = dto.Description;
            entity.StartDate = dto.StartDate;
            entity.EndDate = dto.EndDate;
            entity.IsCurrent = dto.IsCurrent;
            entity.Order = dto.Order;

            await _repository.UpdateAsync(entity);

            var resultDto = new EducationDto
            {
                Id = entity.Id,
                InstitutionName = entity.InstitutionName,
                Degree = entity.Degree,
                FieldOfStudy = entity.FieldOfStudy,
                Description = entity.Description,
                StartDate = entity.StartDate,
                EndDate = entity.EndDate,
                IsCurrent = entity.IsCurrent,
                Order = entity.Order
            };

            return Ok(ApiResponse<EducationDto>.SuccessResponse(resultDto, "Education updated successfully"));
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Education not found"));

            await _repository.DeleteAsync(entity);

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Education deleted successfully"));
        }
    }
}
