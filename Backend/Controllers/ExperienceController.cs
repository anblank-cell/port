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
    public class ExperienceController : ControllerBase
    {
        private readonly IRepository<Experience> _repository;

        public ExperienceController(IRepository<Experience> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<ExperienceDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities
                .OrderBy(e => e.Order)
                .ThenByDescending(e => e.StartDate)
                .Select(e => new ExperienceDto
                {
                    Id = e.Id,
                    CompanyName = e.CompanyName,
                    Role = e.Role,
                    Location = e.Location,
                    Description = e.Description,
                    StartDate = e.StartDate,
                    EndDate = e.EndDate,
                    IsCurrent = e.IsCurrent,
                    Order = e.Order
                });

            return Ok(ApiResponse<IEnumerable<ExperienceDto>>.SuccessResponse(dtos));
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<ExperienceDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<ExperienceDto>.FailureResponse("Experience not found"));

            var dto = new ExperienceDto
            {
                Id = entity.Id,
                CompanyName = entity.CompanyName,
                Role = entity.Role,
                Location = entity.Location,
                Description = entity.Description,
                StartDate = entity.StartDate,
                EndDate = entity.EndDate,
                IsCurrent = entity.IsCurrent,
                Order = entity.Order
            };

            return Ok(ApiResponse<ExperienceDto>.SuccessResponse(dto));
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ExperienceDto>>> Create([FromBody] CreateExperienceDto dto)
        {
            var entity = new Experience
            {
                CompanyName = dto.CompanyName,
                Role = dto.Role,
                Location = dto.Location,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsCurrent = dto.IsCurrent,
                Order = dto.Order
            };

            var created = await _repository.AddAsync(entity);

            var resultDto = new ExperienceDto
            {
                Id = created.Id,
                CompanyName = created.CompanyName,
                Role = created.Role,
                Location = created.Location,
                Description = created.Description,
                StartDate = created.StartDate,
                EndDate = created.EndDate,
                IsCurrent = created.IsCurrent,
                Order = created.Order
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<ExperienceDto>.SuccessResponse(resultDto, "Experience created successfully"));
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ExperienceDto>>> Update(Guid id, [FromBody] UpdateExperienceDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<ExperienceDto>.FailureResponse("Experience not found"));

            entity.CompanyName = dto.CompanyName;
            entity.Role = dto.Role;
            entity.Location = dto.Location;
            entity.Description = dto.Description;
            entity.StartDate = dto.StartDate;
            entity.EndDate = dto.EndDate;
            entity.IsCurrent = dto.IsCurrent;
            entity.Order = dto.Order;

            await _repository.UpdateAsync(entity);

            var resultDto = new ExperienceDto
            {
                Id = entity.Id,
                CompanyName = entity.CompanyName,
                Role = entity.Role,
                Location = entity.Location,
                Description = entity.Description,
                StartDate = entity.StartDate,
                EndDate = entity.EndDate,
                IsCurrent = entity.IsCurrent,
                Order = entity.Order
            };

            return Ok(ApiResponse<ExperienceDto>.SuccessResponse(resultDto, "Experience updated successfully"));
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Experience not found"));

            await _repository.DeleteAsync(entity);

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Experience deleted successfully"));
        }
    }
}
