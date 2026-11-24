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
    public class MenuItemsController : ControllerBase
    {
        private readonly IRepository<MenuItem> _repository;
        private readonly IMemoryCache? _cache;
        private const string CacheKey = "PublicPortfolioData";

        public MenuItemsController(IRepository<MenuItem> repository, IMemoryCache? cache = null)
        {
            _repository = repository;
            _cache = cache;
        }

        private void InvalidateCache()
        {
            _cache?.Remove(CacheKey);
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<MenuItemDto>>>> GetAll()
        {
            var entities = (await _repository.GetAllAsync()).ToList();

            // Auto-seed standard navigation links if table is empty
            if (!entities.Any())
            {
                var defaults = new List<MenuItem>
                {
                    new MenuItem { Title = "Home",       Url = "#hero",       Order = 1, IsVisible = true, IsExternal = false, ParentId = null },
                    new MenuItem { Title = "Services",   Url = "#services",   Order = 2, IsVisible = true, IsExternal = false, ParentId = null },
                    new MenuItem { Title = "Projects",   Url = "#projects",   Order = 3, IsVisible = true, IsExternal = false, ParentId = null },
                    new MenuItem { Title = "Skills",     Url = "#skills",     Order = 4, IsVisible = true, IsExternal = false, ParentId = null },
                    new MenuItem { Title = "Experience", Url = "#experience", Order = 5, IsVisible = true, IsExternal = false, ParentId = null },
                    new MenuItem { Title = "Contact",    Url = "#contact",    Order = 6, IsVisible = true, IsExternal = false, ParentId = null }
                };

                foreach (var item in defaults)
                {
                    await _repository.AddAsync(item);
                }
                entities = (await _repository.GetAllAsync()).ToList();
            }

            var dtos = entities
                .OrderBy(e => e.Order)
                .Select(e => new MenuItemDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Url = e.Url,
                    Order = e.Order,
                    IsVisible = e.IsVisible,
                    IsExternal = e.IsExternal,
                    ParentId = e.ParentId
                });

            return Ok(ApiResponse<IEnumerable<MenuItemDto>>.SuccessResponse(dtos));
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<MenuItemDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<MenuItemDto>.FailureResponse("Menu item not found"));

            var dto = new MenuItemDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Url = entity.Url,
                Order = entity.Order,
                IsVisible = entity.IsVisible,
                IsExternal = entity.IsExternal,
                ParentId = entity.ParentId
            };

            return Ok(ApiResponse<MenuItemDto>.SuccessResponse(dto));
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<MenuItemDto>>> Create([FromBody] CreateMenuItemDto dto)
        {
            var entity = new MenuItem
            {
                Title = dto.Title,
                Url = dto.Url,
                Order = dto.Order,
                IsVisible = dto.IsVisible,
                IsExternal = dto.IsExternal,
                ParentId = dto.ParentId
            };

            var created = await _repository.AddAsync(entity);
            InvalidateCache();

            var resultDto = new MenuItemDto
            {
                Id = created.Id,
                Title = created.Title,
                Url = created.Url,
                Order = created.Order,
                IsVisible = created.IsVisible,
                IsExternal = created.IsExternal,
                ParentId = created.ParentId
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<MenuItemDto>.SuccessResponse(resultDto, "Menu item created successfully"));
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<MenuItemDto>>> Update(Guid id, [FromBody] UpdateMenuItemDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<MenuItemDto>.FailureResponse("Menu item not found"));

            entity.Title = dto.Title;
            entity.Url = dto.Url;
            entity.Order = dto.Order;
            entity.IsVisible = dto.IsVisible;
            entity.IsExternal = dto.IsExternal;
            entity.ParentId = dto.ParentId;

            await _repository.UpdateAsync(entity);
            InvalidateCache();

            var resultDto = new MenuItemDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Url = entity.Url,
                Order = entity.Order,
                IsVisible = entity.IsVisible,
                IsExternal = entity.IsExternal,
                ParentId = entity.ParentId
            };

            return Ok(ApiResponse<MenuItemDto>.SuccessResponse(resultDto, "Menu item updated successfully"));
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<string>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<string>.FailureResponse("Menu item not found"));

            await _repository.DeleteAsync(entity);
            InvalidateCache();

            return Ok(ApiResponse<string>.SuccessResponse("Deleted", "Menu item deleted successfully"));
        }

        /// <summary>
        /// Atomically saves the entire hierarchical list of menu items from the WordPress Menu Structure Canvas.
        /// Preserves order and ParentId relationships.
        /// </summary>
        [HttpPost("batch")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<IEnumerable<MenuItemDto>>>> BatchSave([FromBody] List<MenuItemDto> items)
        {
            if (items == null)
                return BadRequest(ApiResponse<IEnumerable<MenuItemDto>>.FailureResponse("Items list cannot be null"));

            var existing = (await _repository.GetAllAsync()).ToList();

            // Find items to delete (existing items that are not in the new list)
            var newIds = items.Where(i => i.Id != Guid.Empty).Select(i => i.Id).ToHashSet();
            foreach (var item in existing)
            {
                if (!newIds.Contains(item.Id))
                {
                    await _repository.DeleteAsync(item);
                }
            }

            // Map temporary client IDs to newly generated GUIDs for proper parent linking
            var idMap = new Dictionary<Guid, Guid>();
            foreach (var dto in items)
            {
                if (dto.Id == Guid.Empty)
                {
                    var newGuid = Guid.NewGuid();
                    idMap[dto.Id] = newGuid;
                }
            }

            // Step 1: Create or Update entities
            var savedEntities = new List<MenuItem>();
            for (int i = 0; i < items.Count; i++)
            {
                var dto = items[i];
                if (dto.Id != Guid.Empty && existing.Any(e => e.Id == dto.Id))
                {
                    var entity = existing.First(e => e.Id == dto.Id);
                    entity.Title = dto.Title;
                    entity.Url = dto.Url;
                    entity.Order = i + 1;
                    entity.IsVisible = dto.IsVisible;
                    entity.IsExternal = dto.IsExternal;
                    entity.ParentId = dto.ParentId;
                    await _repository.UpdateAsync(entity);
                    savedEntities.Add(entity);
                }
                else
                {
                    var newEntity = new MenuItem
                    {
                        Id = dto.Id != Guid.Empty ? dto.Id : Guid.NewGuid(),
                        Title = dto.Title,
                        Url = dto.Url,
                        Order = i + 1,
                        IsVisible = dto.IsVisible,
                        IsExternal = dto.IsExternal,
                        ParentId = dto.ParentId
                    };
                    var created = await _repository.AddAsync(newEntity);
                    savedEntities.Add(created);
                }
            }

            var resultList = savedEntities.OrderBy(e => e.Order).Select(e => new MenuItemDto
            {
                Id = e.Id,
                Title = e.Title,
                Url = e.Url,
                Order = e.Order,
                IsVisible = e.IsVisible,
                IsExternal = e.IsExternal,
                ParentId = e.ParentId
            }).ToList();

            InvalidateCache();
            return Ok(ApiResponse<IEnumerable<MenuItemDto>>.SuccessResponse(resultList, "Navigation menu saved successfully"));
        }
    }
}
