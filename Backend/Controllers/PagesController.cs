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
    public class PagesController : ControllerBase
    {
        private readonly IRepository<Page> _repository;

        public PagesController(IRepository<Page> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<PageDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities
                .Select(e => new PageDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Slug = e.Slug,
                    HtmlContent = e.HtmlContent,
                    CssContent = e.CssContent,
                    Status = e.Status,
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt
                });

            return Ok(ApiResponse<IEnumerable<PageDto>>.SuccessResponse(dtos));
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<PageDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<PageDto>.FailureResponse("Page not found"));

            var dto = new PageDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Slug = entity.Slug,
                HtmlContent = entity.HtmlContent,
                CssContent = entity.CssContent,
                Status = entity.Status,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };

            return Ok(ApiResponse<PageDto>.SuccessResponse(dto));
        }
        
        [HttpGet("slug/{slug}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<PageDto>>> GetBySlug(string slug)
        {
            var entities = await _repository.GetAllAsync();
            var entity = entities.FirstOrDefault(e => e.Slug == slug);

            if (entity == null)
                return NotFound(ApiResponse<PageDto>.FailureResponse("Page not found"));

            var dto = new PageDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Slug = entity.Slug,
                HtmlContent = entity.HtmlContent,
                CssContent = entity.CssContent,
                Status = entity.Status,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };

            return Ok(ApiResponse<PageDto>.SuccessResponse(dto));
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<PageDto>>> Create([FromBody] CreatePageDto dto)
        {
            var entity = new Page
            {
                Title = dto.Title,
                Slug = dto.Slug,
                Status = dto.Status
            };

            var created = await _repository.AddAsync(entity);

            var resultDto = new PageDto
            {
                Id = created.Id,
                Title = created.Title,
                Slug = created.Slug,
                Status = created.Status,
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<PageDto>.SuccessResponse(resultDto, "Page created successfully"));
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<PageDto>>> Update(Guid id, [FromBody] UpdatePageDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<PageDto>.FailureResponse("Page not found"));

            if (dto.Title != null) entity.Title = dto.Title;
            if (dto.Slug != null) entity.Slug = dto.Slug;
            if (dto.HtmlContent != null) entity.HtmlContent = dto.HtmlContent;
            if (dto.CssContent != null) entity.CssContent = dto.CssContent;
            if (dto.Status != null) entity.Status = dto.Status;

            await _repository.UpdateAsync(entity);

            var resultDto = new PageDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Slug = entity.Slug,
                HtmlContent = entity.HtmlContent,
                CssContent = entity.CssContent,
                Status = entity.Status,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };

            return Ok(ApiResponse<PageDto>.SuccessResponse(resultDto, "Page updated successfully"));
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Page not found"));

            await _repository.DeleteAsync(entity);

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Page deleted successfully"));
        }
    }
}
