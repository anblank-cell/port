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
    public class ProjectsController : ControllerBase
    {
        private readonly IRepository<Project> _repository;

        public ProjectsController(IRepository<Project> repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Get all projects ordered by Order field.
        /// Public endpoint - no authentication required.
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProjectDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities
                .OrderBy(e => e.Order)
                .Select(e => new ProjectDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    ImageUrl = e.ImageUrl,
                    ProjectUrl = e.ProjectUrl,
                    GithubUrl = e.GithubUrl,
                    Technologies = e.Technologies,
                    Order = e.Order,
                    IsFeatured = e.IsFeatured,
                    CategoryTag = e.CategoryTag,
                    CreatedAt = e.CreatedAt
                });

            return Ok(ApiResponse<IEnumerable<ProjectDto>>.SuccessResponse(dtos));
        }

        /// <summary>
        /// Get featured projects only.
        /// Public endpoint - no authentication required.
        /// </summary>
        [HttpGet("featured")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProjectDto>>>> GetFeatured()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities
                .Where(e => e.IsFeatured)
                .OrderBy(e => e.Order)
                .Select(e => new ProjectDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    ImageUrl = e.ImageUrl,
                    ProjectUrl = e.ProjectUrl,
                    GithubUrl = e.GithubUrl,
                    Technologies = e.Technologies,
                    Order = e.Order,
                    IsFeatured = e.IsFeatured,
                    CategoryTag = e.CategoryTag,
                    CreatedAt = e.CreatedAt
                });

            return Ok(ApiResponse<IEnumerable<ProjectDto>>.SuccessResponse(dtos));
        }

        /// <summary>
        /// Get project by ID.
        /// Public endpoint - no authentication required.
        /// </summary>
        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<ProjectDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<ProjectDto>.FailureResponse("Project not found"));

            var dto = new ProjectDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Description = entity.Description,
                ImageUrl = entity.ImageUrl,
                ProjectUrl = entity.ProjectUrl,
                GithubUrl = entity.GithubUrl,
                Technologies = entity.Technologies,
                Order = entity.Order,
                IsFeatured = entity.IsFeatured,
                CategoryTag = entity.CategoryTag,
                CreatedAt = entity.CreatedAt
            };

            return Ok(ApiResponse<ProjectDto>.SuccessResponse(dto));
        }

        /// <summary>
        /// Create a new project.
        /// Admin endpoint - authentication required.
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ProjectDto>>> Create([FromBody] CreateProjectDto dto)
        {
            var entity = new Project
            {
                Title = dto.Title,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                ProjectUrl = dto.ProjectUrl,
                GithubUrl = dto.GithubUrl,
                Technologies = dto.Technologies,
                Order = dto.Order,
                IsFeatured = dto.IsFeatured,
                CategoryTag = dto.CategoryTag
            };

            var created = await _repository.AddAsync(entity);

            var resultDto = new ProjectDto
            {
                Id = created.Id,
                Title = created.Title,
                Description = created.Description,
                ImageUrl = created.ImageUrl,
                ProjectUrl = created.ProjectUrl,
                GithubUrl = created.GithubUrl,
                Technologies = created.Technologies,
                Order = created.Order,
                IsFeatured = created.IsFeatured,
                CategoryTag = created.CategoryTag,
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<ProjectDto>.SuccessResponse(resultDto, "Project created successfully"));
        }

        /// <summary>
        /// Update an existing project.
        /// Admin endpoint - authentication required.
        /// </summary>
        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ProjectDto>>> Update(Guid id, [FromBody] UpdateProjectDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<ProjectDto>.FailureResponse("Project not found"));

            entity.Title = dto.Title;
            entity.Description = dto.Description;
            entity.ImageUrl = dto.ImageUrl;
            entity.ProjectUrl = dto.ProjectUrl;
            entity.GithubUrl = dto.GithubUrl;
            entity.Technologies = dto.Technologies;
            entity.Order = dto.Order;
            entity.IsFeatured = dto.IsFeatured;
            entity.CategoryTag = dto.CategoryTag;

            await _repository.UpdateAsync(entity);

            var resultDto = new ProjectDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Description = entity.Description,
                ImageUrl = entity.ImageUrl,
                ProjectUrl = entity.ProjectUrl,
                GithubUrl = entity.GithubUrl,
                Technologies = entity.Technologies,
                Order = entity.Order,
                IsFeatured = entity.IsFeatured,
                CategoryTag = entity.CategoryTag,
                CreatedAt = entity.CreatedAt
            };

            return Ok(ApiResponse<ProjectDto>.SuccessResponse(resultDto, "Project updated successfully"));
        }

        /// <summary>
        /// Delete a project (soft delete).
        /// Admin endpoint - authentication required.
        /// </summary>
        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Project not found"));

            await _repository.DeleteAsync(entity);

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Project deleted successfully"));
        }
    }
}
