using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Entities;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DuplicatorController : ControllerBase
    {
        private readonly PortfolioDbContext _context;
        private static readonly string _packagesFolder = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "packages")
        );

        public DuplicatorController(PortfolioDbContext context)
        {
            _context = context;
            if (!Directory.Exists(_packagesFolder))
            {
                Directory.CreateDirectory(_packagesFolder);
            }
        }

        public record DuplicatorStatusDto(
            int ProjectsCount,
            int SkillsCount,
            int ServicesCount,
            int TestimonialsCount,
            int ExperiencesCount,
            int EducationsCount,
            int CertificatesCount,
            int SiteSettingsCount,
            int PackagesCount,
            string DatabaseProvider,
            DateTime LastAuditTimeUtc
        );

        public record CreatePackageRequest(string? PackageName, string? Notes);

        public record PackageInfoDto(
            string FileName,
            string PackageName,
            long FileSizeBytes,
            DateTime CreatedAtUtc,
            string? Notes,
            int TotalEntities
        );

        public record RestorePackageRequest(string FileName);

        public record WordPressImportRequest(string? SiteUrl, List<WordPressPostDto>? Posts);

        public record WordPressPostDto(string? Title, string? Content, string? Excerpt, string? ImageUrl, List<string>? Categories);

        [HttpGet("status")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<DuplicatorStatusDto>>> GetStatus()
        {
            var projects = await _context.Projects.CountAsync();
            var skills = await _context.Skills.CountAsync();
            var services = await _context.Services.CountAsync();
            var testimonials = await _context.Testimonials.CountAsync();
            var experiences = await _context.Experiences.CountAsync();
            var educations = await _context.Educations.CountAsync();
            var certs = await _context.Certificates.CountAsync();
            var settings = await _context.SiteSettings.CountAsync();

            var pkgCount = Directory.Exists(_packagesFolder) 
                ? Directory.GetFiles(_packagesFolder, "*.wpdup.json").Length 
                : 0;

            var status = new DuplicatorStatusDto(
                projects,
                skills,
                services,
                testimonials,
                experiences,
                educations,
                certs,
                settings,
                pkgCount,
                _context.Database.ProviderName ?? "Unknown",
                DateTime.UtcNow
            );

            return Ok(ApiResponse<DuplicatorStatusDto>.SuccessResponse(status));
        }

        [HttpGet("packages")]
        [AllowAnonymous]
        public ActionResult<ApiResponse<List<PackageInfoDto>>> GetPackages()
        {
            var list = new List<PackageInfoDto>();
            if (Directory.Exists(_packagesFolder))
            {
                var files = Directory.GetFiles(_packagesFolder, "*.wpdup.json");
                foreach (var file in files.OrderByDescending(f => System.IO.File.GetCreationTimeUtc(f)))
                {
                    try
                    {
                        var info = new FileInfo(file);
                        var json = System.IO.File.ReadAllText(file);
                        using var doc = JsonDocument.Parse(json);
                        var root = doc.RootElement;
                        var name = root.TryGetProperty("packageName", out var pName) ? pName.GetString() ?? info.Name : info.Name;
                        var notes = root.TryGetProperty("notes", out var pNotes) ? pNotes.GetString() : null;
                        var total = root.TryGetProperty("totalEntities", out var pTot) ? pTot.GetInt32() : 0;

                        list.Add(new PackageInfoDto(
                            info.Name,
                            name,
                            info.Length,
                            info.CreationTimeUtc,
                            notes,
                            total
                        ));
                    }
                    catch
                    {
                        var info = new FileInfo(file);
                        list.Add(new PackageInfoDto(info.Name, info.Name, info.Length, info.CreationTimeUtc, null, 0));
                    }
                }
            }
            return Ok(ApiResponse<List<PackageInfoDto>>.SuccessResponse(list));
        }

        [HttpPost("package/create")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<PackageInfoDto>>> CreatePackage([FromBody] CreatePackageRequest request)
        {
            var projects = await _context.Projects.AsNoTracking().ToListAsync();
            var skills = await _context.Skills.AsNoTracking().ToListAsync();
            var services = await _context.Services.AsNoTracking().ToListAsync();
            var testimonials = await _context.Testimonials.AsNoTracking().ToListAsync();
            var experiences = await _context.Experiences.AsNoTracking().ToListAsync();
            var educations = await _context.Educations.AsNoTracking().ToListAsync();
            var certs = await _context.Certificates.AsNoTracking().ToListAsync();
            var settings = await _context.SiteSettings.AsNoTracking().ToListAsync();
            var heroes = await _context.HeroSections.AsNoTracking().ToListAsync();
            var stats = await _context.Statistics.AsNoTracking().ToListAsync();
            var socials = await _context.SocialLinks.AsNoTracking().ToListAsync();

            var total = projects.Count + skills.Count + services.Count + testimonials.Count +
                        experiences.Count + educations.Count + certs.Count + settings.Count +
                        heroes.Count + stats.Count + socials.Count;

            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
            var safeName = string.IsNullOrWhiteSpace(request.PackageName)
                ? $"duplicator_backup_{timestamp}"
                : string.Concat(request.PackageName.Split(Path.GetInvalidFileNameChars())).Replace(" ", "_");

            var fileName = $"{safeName}_{timestamp}.wpdup.json";
            var filePath = Path.Combine(_packagesFolder, fileName);

            var packagePayload = new
            {
                packageName = request.PackageName ?? safeName,
                notes = request.Notes ?? "WordPress Duplicator Site Snapshot",
                createdAtUtc = DateTime.UtcNow,
                totalEntities = total,
                databaseProvider = _context.Database.ProviderName,
                data = new
                {
                    projects,
                    skills,
                    services,
                    testimonials,
                    experiences,
                    educations,
                    certificates = certs,
                    siteSettings = settings,
                    heroSections = heroes,
                    statistics = stats,
                    socialLinks = socials
                }
            };

            var jsonOptions = new JsonSerializerOptions { WriteIndented = true };
            var jsonString = JsonSerializer.Serialize(packagePayload, jsonOptions);
            await System.IO.File.WriteAllTextAsync(filePath, jsonString);

            var fileInfo = new FileInfo(filePath);
            var result = new PackageInfoDto(
                fileInfo.Name,
                request.PackageName ?? safeName,
                fileInfo.Length,
                fileInfo.CreationTimeUtc,
                request.Notes,
                total
            );

            return Ok(ApiResponse<PackageInfoDto>.SuccessResponse(result, "Duplicator package snapshot created successfully."));
        }

        [HttpPost("package/restore")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<string>>> RestorePackage([FromBody] RestorePackageRequest request)
        {
            var filePath = Path.Combine(_packagesFolder, request.FileName);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(ApiResponse<string>.FailureResponse("Specified package does not exist."));
            }

            var jsonString = await System.IO.File.ReadAllTextAsync(filePath);
            using var doc = JsonDocument.Parse(jsonString);
            var root = doc.RootElement;

            if (!root.TryGetProperty("data", out var dataElem))
            {
                return BadRequest(ApiResponse<string>.FailureResponse("Invalid package schema: data element missing."));
            }

            int restoredCount = 0;

            // Restore Projects
            if (dataElem.TryGetProperty("projects", out var pElem))
            {
                var importedProjects = JsonSerializer.Deserialize<List<Project>>(pElem.GetRawText());
                if (importedProjects != null)
                {
                    foreach (var p in importedProjects)
                    {
                        var existing = await _context.Projects.FindAsync(p.Id);
                        if (existing == null)
                        {
                            await _context.Projects.AddAsync(p);
                            restoredCount++;
                        }
                    }
                }
            }

            // Restore Skills
            if (dataElem.TryGetProperty("skills", out var sElem))
            {
                var importedSkills = JsonSerializer.Deserialize<List<Skill>>(sElem.GetRawText());
                if (importedSkills != null)
                {
                    foreach (var s in importedSkills)
                    {
                        var existing = await _context.Skills.FindAsync(s.Id);
                        if (existing == null)
                        {
                            await _context.Skills.AddAsync(s);
                            restoredCount++;
                        }
                    }
                }
            }

            // Restore Services
            if (dataElem.TryGetProperty("services", out var srvElem))
            {
                var importedServices = JsonSerializer.Deserialize<List<Service>>(srvElem.GetRawText());
                if (importedServices != null)
                {
                    foreach (var srv in importedServices)
                    {
                        var existing = await _context.Services.FindAsync(srv.Id);
                        if (existing == null)
                        {
                            await _context.Services.AddAsync(srv);
                            restoredCount++;
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<string>.SuccessResponse($"Restoration complete. Restored {restoredCount} new entities from package."));
        }

        [HttpPost("clone-project/{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<Project>>> CloneProject(Guid id)
        {
            var source = await _context.Projects.FindAsync(id);
            if (source == null)
            {
                return NotFound(ApiResponse<Project>.FailureResponse("Project not found."));
            }

            var clone = new Project
            {
                Id = Guid.NewGuid(),
                Title = $"{source.Title} (Duplicated)",
                Description = source.Description,
                ImageUrl = source.ImageUrl,
                ProjectUrl = source.ProjectUrl,
                GithubUrl = source.GithubUrl,
                Technologies = source.Technologies,
                Order = source.Order + 1,
                IsFeatured = source.IsFeatured,
                CategoryTag = source.CategoryTag != null ? $"{source.CategoryTag} Copy" : "Duplicated",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Projects.AddAsync(clone);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Project>.SuccessResponse(clone, "Project successfully duplicated."));
        }

        [HttpPost("import-wordpress")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<int>>> ImportWordPress([FromBody] WordPressImportRequest request)
        {
            if (request.Posts == null || !request.Posts.Any())
            {
                return BadRequest(ApiResponse<int>.FailureResponse("No WordPress posts provided for import."));
            }

            int imported = 0;
            foreach (var wp in request.Posts)
            {
                var project = new Project
                {
                    Id = Guid.NewGuid(),
                    Title = wp.Title ?? "Untitled WordPress Post",
                    Description = wp.Excerpt ?? (wp.Content != null && wp.Content.Length > 160 ? wp.Content.Substring(0, 160) : wp.Content ?? "Imported from WordPress"),
                    ImageUrl = wp.ImageUrl ?? "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
                    ProjectUrl = request.SiteUrl ?? "https://wordpress.org",
                    GithubUrl = null,
                    Technologies = wp.Categories != null && wp.Categories.Any() ? string.Join(", ", wp.Categories) : "WordPress",
                    Order = imported + 1,
                    IsFeatured = true,
                    CategoryTag = wp.Categories != null && wp.Categories.Any() ? wp.Categories.First() : "WordPress Clone",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _context.Projects.AddAsync(project);
                imported++;
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<int>.SuccessResponse(imported, $"Successfully duplicated {imported} WordPress items into project catalog."));
        }

        [HttpGet("package/download/{fileName}")]
        [AllowAnonymous]
        public IActionResult DownloadPackage(string fileName)
        {
            var filePath = Path.Combine(_packagesFolder, fileName);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(ApiResponse<string>.FailureResponse("Package not found."));
            }

            var contentType = fileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase) 
                ? "application/zip" 
                : "application/json";

            var fileBytes = System.IO.File.ReadAllBytes(filePath);
            return File(fileBytes, contentType, fileName);
        }

        [HttpPost("package/export-zip/{fileName}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<string>>> ExportZip(string fileName)
        {
            var jsonPath = Path.Combine(_packagesFolder, fileName);
            if (!System.IO.File.Exists(jsonPath))
            {
                return NotFound(ApiResponse<string>.FailureResponse("Source snapshot file not found."));
            }

            var zipName = fileName.Replace(".wpdup.json", "") + ".wpdup.zip";
            var zipPath = Path.Combine(_packagesFolder, zipName);

            if (System.IO.File.Exists(zipPath))
            {
                System.IO.File.Delete(zipPath);
            }

            await Task.Run(() =>
            {
                using var zip = ZipFile.Open(zipPath, ZipArchiveMode.Create);
                zip.CreateEntryFromFile(jsonPath, "database.json");

                var uploadsDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Frontend", "public", "uploads"));
                if (Directory.Exists(uploadsDir))
                {
                    foreach (var file in Directory.GetFiles(uploadsDir, "*.*", SearchOption.AllDirectories))
                    {
                        var relPath = Path.GetRelativePath(uploadsDir, file);
                        zip.CreateEntryFromFile(file, Path.Combine("uploads", relPath));
                    }
                }
            });

            return Ok(ApiResponse<string>.SuccessResponse(zipName, $"Portable WordPress Duplicator ZIP package '{zipName}' created successfully."));
        }
    }
}
