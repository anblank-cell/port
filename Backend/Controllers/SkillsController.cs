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
    public class SkillsController : ControllerBase
    {
        private readonly IRepository<Skill> _repository;

        public SkillsController(IRepository<Skill> repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Get all skills ordered by Order field.
        /// Public endpoint - no authentication required.
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<SkillDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities
                .OrderBy(e => e.Order)
                .Select(e => new SkillDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Category = e.Category,
                    ProficiencyPercentage = e.ProficiencyPercentage,
                    Icon = e.Icon,
                    Order = e.Order
                });

            return Ok(ApiResponse<IEnumerable<SkillDto>>.SuccessResponse(dtos));
        }

        /// <summary>
        /// Get skills grouped by category.
        /// Public endpoint - no authentication required.
        /// </summary>
        [HttpGet("by-category")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<Dictionary<string, IEnumerable<SkillDto>>>>> GetByCategory()
        {
            var entities = await _repository.GetAllAsync();
            var grouped = entities
                .OrderBy(e => e.Order)
                .GroupBy(e => e.Category)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => new SkillDto
                    {
                        Id = e.Id,
                        Name = e.Name,
                        Category = e.Category,
                        ProficiencyPercentage = e.ProficiencyPercentage,
                        Icon = e.Icon,
                        Order = e.Order
                    })
                );

            return Ok(ApiResponse<Dictionary<string, IEnumerable<SkillDto>>>.SuccessResponse(grouped));
        }

        /// <summary>
        /// Get skill by ID.
        /// Public endpoint - no authentication required.
        /// </summary>
        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<SkillDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<SkillDto>.FailureResponse("Skill not found"));

            var dto = new SkillDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Category = entity.Category,
                ProficiencyPercentage = entity.ProficiencyPercentage,
                Icon = entity.Icon,
                Order = entity.Order
            };

            return Ok(ApiResponse<SkillDto>.SuccessResponse(dto));
        }

        /// <summary>
        /// Create a new skill.
        /// Admin endpoint - authentication required.
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<SkillDto>>> Create([FromBody] CreateSkillDto dto)
        {
            var entity = new Skill
            {
                Name = dto.Name,
                Category = dto.Category,
                ProficiencyPercentage = dto.ProficiencyPercentage,
                Icon = dto.Icon,
                Order = dto.Order
            };

            var created = await _repository.AddAsync(entity);

            var resultDto = new SkillDto
            {
                Id = created.Id,
                Name = created.Name,
                Category = created.Category,
                ProficiencyPercentage = created.ProficiencyPercentage,
                Icon = created.Icon,
                Order = created.Order
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<SkillDto>.SuccessResponse(resultDto, "Skill created successfully"));
        }

        /// <summary>
        /// Update an existing skill.
        /// Admin endpoint - authentication required.
        /// </summary>
        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<SkillDto>>> Update(Guid id, [FromBody] UpdateSkillDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<SkillDto>.FailureResponse("Skill not found"));

            entity.Name = dto.Name;
            entity.Category = dto.Category;
            entity.ProficiencyPercentage = dto.ProficiencyPercentage;
            entity.Icon = dto.Icon;
            entity.Order = dto.Order;

            await _repository.UpdateAsync(entity);

            var resultDto = new SkillDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Category = entity.Category,
                ProficiencyPercentage = entity.ProficiencyPercentage,
                Icon = entity.Icon,
                Order = entity.Order
            };

            return Ok(ApiResponse<SkillDto>.SuccessResponse(resultDto, "Skill updated successfully"));
        }

        /// <summary>
        /// Delete a skill (soft delete).
        /// Admin endpoint - authentication required.
        /// </summary>
        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Skill not found"));

            await _repository.DeleteAsync(entity);

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Skill deleted successfully"));
        }
    }
}
