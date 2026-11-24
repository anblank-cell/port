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
    public class HeroSectionController : ControllerBase
    {
        private readonly IRepository<HeroSection> _repository;

        public HeroSectionController(IRepository<HeroSection> repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Get all hero sections (typically only one).
        /// Public endpoint - no authentication required.
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<HeroSectionDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities.Select(e => new HeroSectionDto
            {
                Id = e.Id,
                Title = e.Title,
                Subtitle = e.Subtitle,
                Description = e.Description,
                ProfileImageUrl = e.ProfileImageUrl,
                ResumeUrl = e.ResumeUrl,
                IsVisible = e.IsVisible
            });

            return Ok(ApiResponse<IEnumerable<HeroSectionDto>>.SuccessResponse(dtos));
        }

        /// <summary>
        /// Get the active/visible hero section for the public portfolio.
        /// Public endpoint - no authentication required.
        /// </summary>
        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<HeroSectionDto>>> GetActive()
        {
            var entities = await _repository.GetAllAsync();
            var entity = entities.FirstOrDefault(h => h.IsVisible);

            if (entity == null)
                return NotFound(ApiResponse<HeroSectionDto>.FailureResponse("No active hero section found"));

            var dto = new HeroSectionDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Subtitle = entity.Subtitle,
                Description = entity.Description,
                ProfileImageUrl = entity.ProfileImageUrl,
                ResumeUrl = entity.ResumeUrl,
                IsVisible = entity.IsVisible
            };

            return Ok(ApiResponse<HeroSectionDto>.SuccessResponse(dto));
        }

        /// <summary>
        /// Get hero section by ID.
        /// Admin endpoint - authentication required.
        /// </summary>
        [HttpGet("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<HeroSectionDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<HeroSectionDto>.FailureResponse("Hero section not found"));

            var dto = new HeroSectionDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Subtitle = entity.Subtitle,
                Description = entity.Description,
                ProfileImageUrl = entity.ProfileImageUrl,
                ResumeUrl = entity.ResumeUrl,
                IsVisible = entity.IsVisible
            };

            return Ok(ApiResponse<HeroSectionDto>.SuccessResponse(dto));
        }

        /// <summary>
        /// Create a new hero section.
        /// Admin endpoint - authentication required.
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<HeroSectionDto>>> Create([FromBody] CreateHeroSectionDto dto)
        {
            var entity = new HeroSection
            {
                Title = dto.Title,
                Subtitle = dto.Subtitle,
                Description = dto.Description,
                ProfileImageUrl = dto.ProfileImageUrl,
                ResumeUrl = dto.ResumeUrl,
                IsVisible = dto.IsVisible
            };

            var created = await _repository.AddAsync(entity);

            var resultDto = new HeroSectionDto
            {
                Id = created.Id,
                Title = created.Title,
                Subtitle = created.Subtitle,
                Description = created.Description,
                ProfileImageUrl = created.ProfileImageUrl,
                ResumeUrl = created.ResumeUrl,
                IsVisible = created.IsVisible
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<HeroSectionDto>.SuccessResponse(resultDto, "Hero section created successfully"));
        }

        /// <summary>
        /// Update an existing hero section.
        /// Admin endpoint - authentication required.
        /// </summary>
        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<HeroSectionDto>>> Update(Guid id, [FromBody] UpdateHeroSectionDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<HeroSectionDto>.FailureResponse("Hero section not found"));

            entity.Title = dto.Title;
            entity.Subtitle = dto.Subtitle;
            entity.Description = dto.Description;
            entity.ProfileImageUrl = dto.ProfileImageUrl;
            entity.ResumeUrl = dto.ResumeUrl;
            entity.IsVisible = dto.IsVisible;

            await _repository.UpdateAsync(entity);

            var resultDto = new HeroSectionDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Subtitle = entity.Subtitle,
                Description = entity.Description,
                ProfileImageUrl = entity.ProfileImageUrl,
                ResumeUrl = entity.ResumeUrl,
                IsVisible = entity.IsVisible
            };

            return Ok(ApiResponse<HeroSectionDto>.SuccessResponse(resultDto, "Hero section updated successfully"));
        }

        /// <summary>
        /// Delete a hero section (soft delete).
        /// Admin endpoint - authentication required.
        /// </summary>
        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Hero section not found"));

            await _repository.DeleteAsync(entity);

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Hero section deleted successfully"));
        }
    }
}
