using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenusController : ControllerBase
    {
        private readonly PortfolioDbContext _context;
        private readonly IMemoryCache? _cache;
        private const string CacheKey = "PublicPortfolioData";

        public MenusController(PortfolioDbContext context, IMemoryCache? cache = null)
        {
            _context = context;
            _cache = cache;
        }

        private void InvalidateCache()
        {
            _cache?.Remove(CacheKey);
        }

        private static string GenerateSlug(string phrase)
        {
            string str = phrase.ToLowerInvariant();
            str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
            str = Regex.Replace(str, @"\s+", " ").Trim();
            str = Regex.Replace(str, @"\s", "-");
            return string.IsNullOrWhiteSpace(str) ? "menu-" + Guid.NewGuid().ToString("N")[..6] : str;
        }

        private async Task EnsureDefaultMenuExistsAsync()
        {
            if (!await _context.Menus.AnyAsync())
            {
                var defaultMenu = new Menu
                {
                    Name = "Primary Navigation Menu",
                    Slug = "primary-navigation",
                    Location = "header",
                    IsPrimary = true
                };

                await _context.Menus.AddAsync(defaultMenu);
                await _context.SaveChangesAsync();

                // Assign any orphan MenuItem records to this primary menu
                var existingItems = await _context.MenuItems.Where(m => m.MenuId == null).ToListAsync();
                if (existingItems.Any())
                {
                    foreach (var item in existingItems)
                    {
                        item.MenuId = defaultMenu.Id;
                    }
                }
                else
                {
                    // Seed standard navigation links
                    var defaultItems = new List<MenuItem>
                    {
                        new MenuItem { MenuId = defaultMenu.Id, Title = "Home",       Url = "#hero",       Order = 1, IsVisible = true, IsExternal = false, ParentId = null },
                        new MenuItem { MenuId = defaultMenu.Id, Title = "Services",   Url = "#services",   Order = 2, IsVisible = true, IsExternal = false, ParentId = null },
                        new MenuItem { MenuId = defaultMenu.Id, Title = "Projects",   Url = "#projects",   Order = 3, IsVisible = true, IsExternal = false, ParentId = null },
                        new MenuItem { MenuId = defaultMenu.Id, Title = "Skills",     Url = "#skills",     Order = 4, IsVisible = true, IsExternal = false, ParentId = null },
                        new MenuItem { MenuId = defaultMenu.Id, Title = "Experience", Url = "#experience", Order = 5, IsVisible = true, IsExternal = false, ParentId = null },
                        new MenuItem { MenuId = defaultMenu.Id, Title = "Contact",    Url = "#contact",    Order = 6, IsVisible = true, IsExternal = false, ParentId = null }
                    };
                    await _context.MenuItems.AddRangeAsync(defaultItems);
                }

                await _context.SaveChangesAsync();
                InvalidateCache();
            }
        }

        /// <summary>
        /// Retrieves all menus with summary information.
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<MenuSummaryDto>>>> GetAll()
        {
            await EnsureDefaultMenuExistsAsync();

            var menus = await _context.Menus
                .AsNoTracking()
                .Include(m => m.Items)
                .OrderByDescending(m => m.IsPrimary)
                .ThenBy(m => m.Name)
                .Select(m => new MenuSummaryDto
                {
                    Id = m.Id,
                    Name = m.Name,
                    Slug = m.Slug,
                    Location = m.Location,
                    IsPrimary = m.IsPrimary,
                    ItemCount = m.Items.Count,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt
                })
                .ToListAsync();

            return Ok(ApiResponse<IEnumerable<MenuSummaryDto>>.SuccessResponse(menus));
        }

        /// <summary>
        /// Retrieves a specific menu with all its ordered hierarchical items.
        /// </summary>
        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<MenuDetailDto>>> GetById(Guid id)
        {
            await EnsureDefaultMenuExistsAsync();

            var menu = await _context.Menus
                .AsNoTracking()
                .Include(m => m.Items)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (menu == null)
                return NotFound(ApiResponse<MenuDetailDto>.FailureResponse("Menu not found"));

            var dto = new MenuDetailDto
            {
                Id = menu.Id,
                Name = menu.Name,
                Slug = menu.Slug,
                Location = menu.Location,
                IsPrimary = menu.IsPrimary,
                Items = menu.Items
                    .OrderBy(i => i.Order)
                    .Select(i => new MenuItemDto
                    {
                        Id = i.Id,
                        Title = i.Title,
                        Url = i.Url,
                        Order = i.Order,
                        IsVisible = i.IsVisible,
                        IsExternal = i.IsExternal,
                        ParentId = i.ParentId
                    })
                    .ToList()
            };

            return Ok(ApiResponse<MenuDetailDto>.SuccessResponse(dto));
        }

        /// <summary>
        /// Creates a new navigation menu.
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<MenuDetailDto>>> Create([FromBody] CreateMenuDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(ApiResponse<MenuDetailDto>.FailureResponse("Menu name is required"));

            if (dto.IsPrimary)
            {
                var existingPrimary = await _context.Menus.Where(m => m.IsPrimary).ToListAsync();
                foreach (var p in existingPrimary) p.IsPrimary = false;
            }

            var menu = new Menu
            {
                Name = dto.Name.Trim(),
                Slug = GenerateSlug(dto.Name),
                Location = dto.Location?.Trim(),
                IsPrimary = dto.IsPrimary
            };

            await _context.Menus.AddAsync(menu);
            await _context.SaveChangesAsync();
            InvalidateCache();

            var resultDto = new MenuDetailDto
            {
                Id = menu.Id,
                Name = menu.Name,
                Slug = menu.Slug,
                Location = menu.Location,
                IsPrimary = menu.IsPrimary,
                Items = new List<MenuItemDto>()
            };

            return CreatedAtAction(nameof(GetById), new { id = menu.Id },
                ApiResponse<MenuDetailDto>.SuccessResponse(resultDto, "Menu created successfully"));
        }

        /// <summary>
        /// Updates a menu's name and location assignments.
        /// </summary>
        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<MenuDetailDto>>> Update(Guid id, [FromBody] UpdateMenuDto dto)
        {
            var menu = await _context.Menus.Include(m => m.Items).FirstOrDefaultAsync(m => m.Id == id);
            if (menu == null)
                return NotFound(ApiResponse<MenuDetailDto>.FailureResponse("Menu not found"));

            if (dto.IsPrimary && !menu.IsPrimary)
            {
                var existingPrimary = await _context.Menus.Where(m => m.IsPrimary && m.Id != id).ToListAsync();
                foreach (var p in existingPrimary) p.IsPrimary = false;
            }

            menu.Name = dto.Name.Trim();
            menu.Location = dto.Location?.Trim();
            menu.IsPrimary = dto.IsPrimary;

            await _context.SaveChangesAsync();
            InvalidateCache();

            var resultDto = new MenuDetailDto
            {
                Id = menu.Id,
                Name = menu.Name,
                Slug = menu.Slug,
                Location = menu.Location,
                IsPrimary = menu.IsPrimary,
                Items = menu.Items
                    .OrderBy(i => i.Order)
                    .Select(i => new MenuItemDto
                    {
                        Id = i.Id,
                        Title = i.Title,
                        Url = i.Url,
                        Order = i.Order,
                        IsVisible = i.IsVisible,
                        IsExternal = i.IsExternal,
                        ParentId = i.ParentId
                    })
                    .ToList()
            };

            return Ok(ApiResponse<MenuDetailDto>.SuccessResponse(resultDto, "Menu updated successfully"));
        }

        /// <summary>
        /// Deletes a menu and all its child menu items.
        /// </summary>
        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<string>>> Delete(Guid id)
        {
            var totalCount = await _context.Menus.CountAsync();
            if (totalCount <= 1)
            {
                return BadRequest(ApiResponse<string>.FailureResponse("Cannot delete the only remaining menu."));
            }

            var menu = await _context.Menus.Include(m => m.Items).FirstOrDefaultAsync(m => m.Id == id);
            if (menu == null)
                return NotFound(ApiResponse<string>.FailureResponse("Menu not found"));

            bool wasPrimary = menu.IsPrimary;

            _context.MenuItems.RemoveRange(menu.Items);
            _context.Menus.Remove(menu);
            await _context.SaveChangesAsync();

            // If the deleted menu was primary, assign primary to the first available menu
            if (wasPrimary)
            {
                var nextMenu = await _context.Menus.FirstOrDefaultAsync();
                if (nextMenu != null)
                {
                    nextMenu.IsPrimary = true;
                    if (string.IsNullOrWhiteSpace(nextMenu.Location)) nextMenu.Location = "header";
                    await _context.SaveChangesAsync();
                }
            }

            InvalidateCache();
            return Ok(ApiResponse<string>.SuccessResponse("Deleted", "Menu deleted successfully"));
        }

        /// <summary>
        /// Atomically saves the entire hierarchical list of menu items for a specific menu.
        /// </summary>
        [HttpPost("{id:guid}/items/batch")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<MenuDetailDto>>> BatchSaveItems(Guid id, [FromBody] List<MenuItemDto> items)
        {
            var menu = await _context.Menus.Include(m => m.Items).FirstOrDefaultAsync(m => m.Id == id);
            if (menu == null)
                return NotFound(ApiResponse<MenuDetailDto>.FailureResponse("Menu not found"));

            items ??= new List<MenuItemDto>();

            var existing = menu.Items.ToList();
            var newIds = items.Where(i => i.Id != Guid.Empty).Select(i => i.Id).ToHashSet();

            // Delete removed items
            foreach (var item in existing)
            {
                if (!newIds.Contains(item.Id))
                {
                    _context.MenuItems.Remove(item);
                }
            }

            // Create or update items
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
                    entity.MenuId = menu.Id;
                    savedEntities.Add(entity);
                }
                else
                {
                    var newEntity = new MenuItem
                    {
                        Id = dto.Id != Guid.Empty ? dto.Id : Guid.NewGuid(),
                        MenuId = menu.Id,
                        Title = dto.Title,
                        Url = dto.Url,
                        Order = i + 1,
                        IsVisible = dto.IsVisible,
                        IsExternal = dto.IsExternal,
                        ParentId = dto.ParentId
                    };
                    await _context.MenuItems.AddAsync(newEntity);
                    savedEntities.Add(newEntity);
                }
            }

            await _context.SaveChangesAsync();
            InvalidateCache();

            var resultDto = new MenuDetailDto
            {
                Id = menu.Id,
                Name = menu.Name,
                Slug = menu.Slug,
                Location = menu.Location,
                IsPrimary = menu.IsPrimary,
                Items = savedEntities.OrderBy(e => e.Order).Select(e => new MenuItemDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Url = e.Url,
                    Order = e.Order,
                    IsVisible = e.IsVisible,
                    IsExternal = e.IsExternal,
                    ParentId = e.ParentId
                }).ToList()
            };

            return Ok(ApiResponse<MenuDetailDto>.SuccessResponse(resultDto, "Menu items saved successfully"));
        }
    }
}
