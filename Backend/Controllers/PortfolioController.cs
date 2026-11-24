using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/portfolio")]
    public class PortfolioController : ControllerBase
    {
        private readonly PortfolioDbContext _context;
        private readonly IMemoryCache _cache;
        private const string CacheKey = "PublicPortfolioData";

        public PortfolioController(PortfolioDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<PublicPortfolioDto>>> GetPublicPortfolio()
        {
            try
            {
                if (_cache.TryGetValue(CacheKey, out PublicPortfolioDto? cachedData) && cachedData != null)
                {
                    return Ok(ApiResponse<PublicPortfolioDto>.SuccessResponse(cachedData));
                }

                // Query all active sections in parallel/efficient non-tracking queries
                var heroTask = _context.HeroSections.AsNoTracking().FirstOrDefaultAsync(h => h.IsVisible);
                var servicesTask = _context.Services.AsNoTracking().OrderBy(s => s.Order).ToListAsync();
                var projectsTask = _context.Projects.AsNoTracking().Where(p => p.IsFeatured).OrderBy(p => p.Order).ToListAsync();
                var skillsTask = _context.Skills.AsNoTracking().OrderBy(s => s.Order).ToListAsync();
                var expTask = _context.Experiences.AsNoTracking().OrderBy(e => e.Order).ToListAsync();
                var eduTask = _context.Educations.AsNoTracking().OrderBy(e => e.Order).ToListAsync();
                var certTask = _context.Certificates.AsNoTracking().OrderBy(c => c.Order).ToListAsync();
                var testTask = _context.Testimonials.AsNoTracking().OrderBy(t => t.Order).ToListAsync();
                var statsTask = _context.Statistics.AsNoTracking().OrderBy(s => s.Order).ToListAsync();
                var socialTask = _context.SocialLinks.AsNoTracking().OrderBy(s => s.Order).ToListAsync();
                var primaryMenuTask = _context.Menus.AsNoTracking().Include(m => m.Items).FirstOrDefaultAsync(m => m.Location == "header" || m.IsPrimary);
                var fallbackMenuTask = _context.MenuItems.AsNoTracking().Where(m => m.IsVisible).OrderBy(m => m.Order).ToListAsync();
                var settingsTask = _context.SiteSettings.AsNoTracking().ToListAsync();

                await Task.WhenAll(
                    heroTask, servicesTask, projectsTask, skillsTask,
                    expTask, eduTask, certTask, testTask,
                    statsTask, socialTask, primaryMenuTask, fallbackMenuTask, settingsTask
                );

                var primaryMenu = await primaryMenuTask;
                var rawMenuItems = (primaryMenu != null && primaryMenu.Items.Any())
                    ? primaryMenu.Items.Where(i => i.IsVisible).OrderBy(i => i.Order).ToList()
                    : (await fallbackMenuTask);

                var hero = await heroTask;
                var skills = await skillsTask;
                var skillsByCategory = skills
                    .GroupBy(s => s.Category)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(s => new SkillDto
                        {
                            Id = s.Id,
                            Name = s.Name,
                            Category = s.Category,
                            ProficiencyPercentage = s.ProficiencyPercentage,
                            Icon = s.Icon,
                            Order = s.Order
                        }).ToList()
                    );

                var settings = (await settingsTask).ToDictionary(s => s.Key, s => s.Value);

                var dto = new PublicPortfolioDto
                {
                    Hero = hero == null ? null : new HeroSectionDto
                    {
                        Id = hero.Id,
                        Title = hero.Title,
                        Subtitle = hero.Subtitle,
                        Description = hero.Description,
                        ProfileImageUrl = hero.ProfileImageUrl,
                        ResumeUrl = hero.ResumeUrl,
                        IsVisible = hero.IsVisible
                    },
                    Services = (await servicesTask).Select(s => new ServiceDto
                    {
                        Id = s.Id,
                        Name = s.Name,
                        Description = s.Description,
                        Icon = s.Icon,
                        Order = s.Order
                    }),
                    Projects = (await projectsTask).Select(p => new ProjectDto
                    {
                        Id = p.Id,
                        Title = p.Title,
                        Description = p.Description,
                        ImageUrl = p.ImageUrl,
                        ProjectUrl = p.ProjectUrl,
                        GithubUrl = p.GithubUrl,
                        CategoryTag = p.CategoryTag,
                        Technologies = p.Technologies,
                        Order = p.Order,
                        IsFeatured = p.IsFeatured
                    }),
                    SkillsByCategory = skillsByCategory,
                    Experience = (await expTask).Select(e => new ExperienceDto
                    {
                        Id = e.Id,
                        Role = e.Role,
                        CompanyName = e.CompanyName,
                        Location = e.Location,
                        StartDate = e.StartDate,
                        EndDate = e.EndDate,
                        IsCurrent = e.IsCurrent,
                        Description = e.Description,
                        Order = e.Order
                    }),
                    Education = (await eduTask).Select(e => new EducationDto
                    {
                        Id = e.Id,
                        InstitutionName = e.InstitutionName,
                        Degree = e.Degree,
                        FieldOfStudy = e.FieldOfStudy,
                        StartDate = e.StartDate,
                        EndDate = e.EndDate,
                        IsCurrent = e.IsCurrent,
                        Description = e.Description,
                        Order = e.Order
                    }),
                    Certificates = (await certTask).Select(c => new CertificateDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        IssuingOrganization = c.IssuingOrganization,
                        IssueDate = c.IssueDate,
                        CredentialId = c.CredentialId,
                        CredentialUrl = c.CredentialUrl,
                        ImageUrl = c.ImageUrl,
                        Order = c.Order
                    }),
                    Testimonials = (await testTask).Select(t => new TestimonialDto
                    {
                        Id = t.Id,
                        ClientName = t.ClientName,
                        ClientRole = t.ClientRole,
                        CompanyName = t.CompanyName,
                        Feedback = t.Feedback,
                        ClientImageUrl = t.ClientImageUrl,
                        Order = t.Order
                    }),
                    Statistics = (await statsTask).Select(s => new StatisticDto
                    {
                        Id = s.Id,
                        Label = s.Label,
                        Value = s.Value,
                        Icon = s.Icon,
                        Order = s.Order
                    }),
                    SocialLinks = (await socialTask).Select(s => new SocialLinkDto
                    {
                        Id = s.Id,
                        PlatformName = s.PlatformName,
                        Url = s.Url,
                        Icon = s.Icon,
                        Order = s.Order
                    }),
                    MenuItems = rawMenuItems.Select(m => new MenuItemDto
                    {
                        Id = m.Id,
                        Title = m.Title,
                        Url = m.Url,
                        Order = m.Order,
                        IsVisible = m.IsVisible,
                        IsExternal = m.IsExternal,
                        ParentId = m.ParentId
                    }),
                    Settings = settings
                };

                // Cache for 60 seconds (with sliding expiration)
                _cache.Set(CacheKey, dto, new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60),
                    SlidingExpiration = TimeSpan.FromSeconds(30)
                });

                return Ok(ApiResponse<PublicPortfolioDto>.SuccessResponse(dto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<PublicPortfolioDto>.FailureResponse($"Failed to retrieve portfolio data: {ex.Message}"));
            }
        }

        [HttpPost("clear-cache")]
        [Authorize]
        public ActionResult<ApiResponse<bool>> ClearCache()
        {
            _cache.Remove(CacheKey);
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Portfolio cache invalidated"));
        }
    }
}
