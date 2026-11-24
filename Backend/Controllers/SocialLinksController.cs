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
    public class SocialLinksController : ControllerBase
    {
        private readonly IRepository<SocialLink> _repository;

        public SocialLinksController(IRepository<SocialLink> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<SocialLinkDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities
                .OrderBy(e => e.Order)
                .Select(e => new SocialLinkDto
                {
                    Id = e.Id,
                    PlatformName = e.PlatformName,
                    Url = e.Url,
                    Icon = e.Icon,
                    Order = e.Order
                });

            return Ok(ApiResponse<IEnumerable<SocialLinkDto>>.SuccessResponse(dtos));
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<SocialLinkDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<SocialLinkDto>.FailureResponse("Social link not found"));

            var dto = new SocialLinkDto
            {
                Id = entity.Id,
                PlatformName = entity.PlatformName,
                Url = entity.Url,
                Icon = entity.Icon,
                Order = entity.Order
            };

            return Ok(ApiResponse<SocialLinkDto>.SuccessResponse(dto));
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<SocialLinkDto>>> Create([FromBody] CreateSocialLinkDto dto)
        {
            var entity = new SocialLink
            {
                PlatformName = dto.PlatformName,
                Url = dto.Url,
                Icon = dto.Icon,
                Order = dto.Order
            };

            var created = await _repository.AddAsync(entity);

            var resultDto = new SocialLinkDto
            {
                Id = created.Id,
                PlatformName = created.PlatformName,
                Url = created.Url,
                Icon = created.Icon,
                Order = created.Order
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<SocialLinkDto>.SuccessResponse(resultDto, "Social link created successfully"));
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<SocialLinkDto>>> Update(Guid id, [FromBody] UpdateSocialLinkDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<SocialLinkDto>.FailureResponse("Social link not found"));

            entity.PlatformName = dto.PlatformName;
            entity.Url = dto.Url;
            entity.Icon = dto.Icon;
            entity.Order = dto.Order;

            await _repository.UpdateAsync(entity);

            var resultDto = new SocialLinkDto
            {
                Id = entity.Id,
                PlatformName = entity.PlatformName,
                Url = entity.Url,
                Icon = entity.Icon,
                Order = entity.Order
            };

            return Ok(ApiResponse<SocialLinkDto>.SuccessResponse(resultDto, "Social link updated successfully"));
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Social link not found"));

            await _repository.DeleteAsync(entity);

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Social link deleted successfully"));
        }
    }
}
