using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SiteSettingsController : ControllerBase
    {
        private readonly IRepository<SiteSetting> _repository;
        private readonly IMemoryCache _cache;
        private readonly IEmailService _emailService;
        private const string PortfolioCacheKey = "PublicPortfolioData";

        public SiteSettingsController(IRepository<SiteSetting> repository, IMemoryCache cache, IEmailService emailService)
        {
            _repository = repository;
            _cache = cache;
            _emailService = emailService;
        }

        private void InvalidateCache()
        {
            _cache.Remove(PortfolioCacheKey);
        }

        /// <summary>
        /// Get all site settings.
        /// Public endpoint - no authentication required.
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<SiteSettingDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities.Select(e => new SiteSettingDto
            {
                Id = e.Id,
                Key = e.Key,
                Value = e.Value
            });

            return Ok(ApiResponse<IEnumerable<SiteSettingDto>>.SuccessResponse(dtos));
        }

        /// <summary>
        /// Get all site settings as a dictionary (key-value pairs).
        /// Public endpoint - no authentication required.
        /// </summary>
        [HttpGet("dictionary")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<Dictionary<string, string>>>> GetAsDictionary()
        {
            var entities = await _repository.GetAllAsync();
            var dictionary = entities.ToDictionary(e => e.Key, e => e.Value);

            return Ok(ApiResponse<Dictionary<string, string>>.SuccessResponse(dictionary));
        }

        /// <summary>
        /// Get a site setting by key.
        /// Public endpoint - no authentication required.
        /// </summary>
        [HttpGet("by-key/{key}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<SiteSettingDto>>> GetByKey(string key)
        {
            var entities = await _repository.GetAllAsync();
            var entity = entities.FirstOrDefault(s => s.Key == key);

            if (entity == null)
                return NotFound(ApiResponse<SiteSettingDto>.FailureResponse($"Setting with key '{key}' not found"));

            var dto = new SiteSettingDto
            {
                Id = entity.Id,
                Key = entity.Key,
                Value = entity.Value
            };

            return Ok(ApiResponse<SiteSettingDto>.SuccessResponse(dto));
        }

        /// <summary>
        /// Get site setting by ID (admin only).
        /// </summary>
        [HttpGet("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<SiteSettingDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<SiteSettingDto>.FailureResponse("Site setting not found"));

            var dto = new SiteSettingDto
            {
                Id = entity.Id,
                Key = entity.Key,
                Value = entity.Value
            };

            return Ok(ApiResponse<SiteSettingDto>.SuccessResponse(dto));
        }

        /// <summary>
        /// Create or update a site setting by key (admin only).
        /// </summary>
        [HttpPost("upsert")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<SiteSettingDto>>> Upsert([FromBody] CreateSiteSettingDto dto)
        {
            var entities = await _repository.GetAllAsync();
            var existing = entities.FirstOrDefault(s => string.Equals(s.Key, dto.Key, StringComparison.OrdinalIgnoreCase));

            if (existing != null)
            {
                existing.Value = dto.Value;
                await _repository.UpdateAsync(existing);
                InvalidateCache();

                var resultDto = new SiteSettingDto
                {
                    Id = existing.Id,
                    Key = existing.Key,
                    Value = existing.Value
                };

                return Ok(ApiResponse<SiteSettingDto>.SuccessResponse(resultDto, "Site setting updated successfully"));
            }
            else
            {
                var entity = new SiteSetting
                {
                    Key = dto.Key,
                    Value = dto.Value
                };

                var created = await _repository.AddAsync(entity);
                InvalidateCache();

                var resultDto = new SiteSettingDto
                {
                    Id = created.Id,
                    Key = created.Key,
                    Value = created.Value
                };

                return Ok(ApiResponse<SiteSettingDto>.SuccessResponse(resultDto, "Site setting created successfully"));
            }
        }

        /// <summary>
        /// Create a new site setting (admin only).
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<SiteSettingDto>>> Create([FromBody] CreateSiteSettingDto dto)
        {
            // Check if key already exists
            var entities = await _repository.GetAllAsync();
            if (entities.Any(s => s.Key == dto.Key))
            {
                return BadRequest(ApiResponse<SiteSettingDto>.FailureResponse($"Setting with key '{dto.Key}' already exists"));
            }

            var entity = new SiteSetting
            {
                Key = dto.Key,
                Value = dto.Value
            };

            var created = await _repository.AddAsync(entity);
            InvalidateCache();

            var resultDto = new SiteSettingDto
            {
                Id = created.Id,
                Key = created.Key,
                Value = created.Value
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<SiteSettingDto>.SuccessResponse(resultDto, "Site setting created successfully"));
        }

        /// <summary>
        /// Update an existing site setting (admin only).
        /// </summary>
        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<SiteSettingDto>>> Update(Guid id, [FromBody] UpdateSiteSettingDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<SiteSettingDto>.FailureResponse("Site setting not found"));

            // Check if key is being changed and if new key already exists
            if (entity.Key != dto.Key)
            {
                var entities = await _repository.GetAllAsync();
                if (entities.Any(s => s.Key == dto.Key && s.Id != id))
                {
                    return BadRequest(ApiResponse<SiteSettingDto>.FailureResponse($"Setting with key '{dto.Key}' already exists"));
                }
            }

            entity.Key = dto.Key;
            entity.Value = dto.Value;

            await _repository.UpdateAsync(entity);
            InvalidateCache();

            var resultDto = new SiteSettingDto
            {
                Id = entity.Id,
                Key = entity.Key,
                Value = entity.Value
            };

            return Ok(ApiResponse<SiteSettingDto>.SuccessResponse(resultDto, "Site setting updated successfully"));
        }

        /// <summary>
        /// Delete a site setting (admin only, soft delete).
        /// </summary>
        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Site setting not found"));

            await _repository.DeleteAsync(entity);
            InvalidateCache();

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Site setting deleted successfully"));
        }

        /// <summary>
        /// Test email configuration by sending a verification email (admin only).
        /// </summary>
        [HttpPost("test-email")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> TestEmail([FromBody] EmailTestRequestDto? dto)
        {
            var targetEmail = dto?.TargetEmail;
            var (success, message) = await _emailService.SendTestEmailAsync(targetEmail ?? string.Empty);

            if (!success)
            {
                return BadRequest(ApiResponse<object>.FailureResponse(message));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { message }, message));
        }
    }
}
