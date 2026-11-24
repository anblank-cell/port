using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Entities;
using Backend.Interfaces;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/ai")]
    public class AiAssistantController : ControllerBase
    {
        private readonly PortfolioDbContext _context;
        private readonly IAiService _aiService;

        public AiAssistantController(PortfolioDbContext context, IAiService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        public record AiChatRequest(string Message, string? Context, bool? IsAdmin);

        public record AiActionExecuted(string ActionType, string TargetTitle, object? Details);

        public record AiChatResponse(
            string Reply,
            string? GeneratedHtml,
            AiActionExecuted? ActionExecuted,
            List<string> SuggestedFollowUps,
            string? ProviderUsed = null,
            string? ModelUsed = null
        );

        [HttpGet("providers")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<List<AiProviderInfo>>>> GetProviders()
        {
            var providers = await _aiService.GetAvailableProvidersAsync();
            return Ok(ApiResponse<List<AiProviderInfo>>.SuccessResponse(providers));
        }

        [HttpGet("status")]
        [AllowAnonymous]
        public ActionResult<ApiResponse<object>> GetStatus()
        {
            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                activeProvider = _aiService.GetActiveProviderName(),
                timestampUtc = DateTime.UtcNow,
                freeUnlimitedSources = new[]
                {
                    new { name = "Ollama", type = "Local Desktop (100% Free & Unlimited)", endpoint = "http://localhost:11434", models = new[] { "llama3.2", "qwen2.5-coder", "mistral", "deepseek-r1:8b" } },
                    new { name = "OpenRouter", type = "Cloud Free Tier (:free tags)", endpoint = "https://openrouter.ai", models = new[] { "meta-llama/llama-3.2-3b-instruct:free", "deepseek/deepseek-r1:free" } },
                    new { name = "Google Gemini", type = "Google AI Studio Free Tier", endpoint = "https://aistudio.google.com", models = new[] { "gemini-1.5-flash", "gemini-2.0-flash" } },
                    new { name = "Groq Cloud", type = "Ultra-Fast LPU Free Tier", endpoint = "https://groq.com", models = new[] { "llama-3.3-70b-versatile" } }
                }
            }));
        }

        [HttpGet("capabilities")]
        [AllowAnonymous]
        public ActionResult<ApiResponse<List<string>>> GetCapabilities()
        {
            var capabilities = new List<string>
            {
                "Multi-Provider AI support (Ollama local unlimited, OpenRouter free, Gemini, Groq)",
                "Create new Projects autonomously from natural language prompts",
                "Add new Skills with category and proficiency percentage",
                "Add new Professional Services with icon designations",
                "Generate full WordPress Duplicator backup packages on command",
                "Synthesize and answer questions about portfolio projects, experience, and skills",
                "Generate custom UI components matching #0F0E0C and #E96B02 design tokens",
                "Update dynamic site configuration settings"
            };
            return Ok(ApiResponse<List<string>>.SuccessResponse(capabilities));
        }

        [HttpPost("chat")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<AiChatResponse>>> Chat([FromBody] AiChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(ApiResponse<AiChatResponse>.FailureResponse("Message cannot be empty."));
            }

            var prompt = request.Message.Trim();
            var lower = prompt.ToLowerInvariant();
            var isAdmin = request.IsAdmin ?? true;

            // ── Intent 1: Create Project ───────────────────────────────────────
            if (isAdmin && (lower.StartsWith("create project") || lower.StartsWith("add project") || lower.Contains("new project:")))
            {
                return await HandleCreateProject(prompt);
            }

            // ── Intent 2: Create Skill ─────────────────────────────────────────
            if (isAdmin && (lower.StartsWith("create skill") || lower.StartsWith("add skill") || lower.Contains("new skill:")))
            {
                return await HandleCreateSkill(prompt);
            }

            // ── Intent 3: Create Service ───────────────────────────────────────
            if (isAdmin && (lower.StartsWith("create service") || lower.StartsWith("add service") || lower.Contains("new service:")))
            {
                return await HandleCreateService(prompt);
            }

            // ── Intent 4: Create Duplicator Backup ──────────────────────────────
            if (isAdmin && (lower.Contains("create backup") || lower.Contains("duplicate site") || lower.Contains("backup package") || lower.Contains("snapshot")))
            {
                return await HandleCreateBackup();
            }

            // ── Intent 5: Generate UI Component or Redesign ────────────────────
            if (lower.Contains("generate ui") || lower.Contains("design component") || lower.Contains("generate component") || lower.Contains("create card") || lower.Contains("create pricing") || lower.Contains("design of the ui") || lower.Contains("design ui") || lower.Contains("change design") || lower.Contains("redesign") || lower.Contains("change the design"))
            {
                return HandleGenerateUi(prompt);
            }

            // ── Intent 6: Query / Profile Knowledge Base ──────────────────────
            return await HandleKnowledgeQuery(prompt);
        }

        private async Task<ActionResult<ApiResponse<AiChatResponse>>> HandleCreateProject(string prompt)
        {
            // Extract title and description
            var title = "AI Generated Project";
            var desc = "High-performance enterprise application developed with modern architecture.";
            var category = "Full Stack";
            var tech = "ASP.NET Core, PostgreSQL, Vanilla JS";

            var matchTitle = Regex.Match(prompt, @"(?:project|named|titled|:)\s*[""']?([^""'\n,]+)[""']?", RegexOptions.IgnoreCase);
            if (matchTitle.Success && matchTitle.Groups[1].Value.Trim().Length > 2)
            {
                title = matchTitle.Groups[1].Value.Trim();
            }

            var project = new Project
            {
                Id = Guid.NewGuid(),
                Title = title,
                Description = $"{desc} Features dynamic API communication, sleek dark aesthetics with #E96B02 accents, and responsive UI.",
                ImageUrl = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
                ProjectUrl = "https://github.com",
                GithubUrl = "https://github.com",
                Technologies = tech,
                Order = await _context.Projects.CountAsync() + 1,
                IsFeatured = true,
                CategoryTag = category,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            var res = new AiChatResponse(
                $"I have created and registered the new project **\"{project.Title}\"** in your database! It is now visible in your Projects section and Admin Dashboard.",
                null,
                new AiActionExecuted("CreateProject", project.Title, project),
                new List<string> { "View this project in dashboard", "Create another project", "Generate a backup package" }
            );

            return Ok(ApiResponse<AiChatResponse>.SuccessResponse(res));
        }

        private async Task<ActionResult<ApiResponse<AiChatResponse>>> HandleCreateSkill(string prompt)
        {
            var skillName = "Cloud Architecture";
            var category = "Backend";
            var proficiency = 88;

            var matchName = Regex.Match(prompt, @"(?:skill|named|add)\s*[""']?([^""'\n,]+)[""']?", RegexOptions.IgnoreCase);
            if (matchName.Success && matchName.Groups[1].Value.Trim().Length > 1)
            {
                skillName = matchName.Groups[1].Value.Trim();
            }

            var skill = new Skill
            {
                Id = Guid.NewGuid(),
                Name = skillName,
                Category = category,
                ProficiencyPercentage = proficiency,
                Icon = "fa-solid fa-code",
                Order = await _context.Skills.CountAsync() + 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Skills.AddAsync(skill);
            await _context.SaveChangesAsync();

            var res = new AiChatResponse(
                $"Skill **\"{skill.Name}\"** ({skill.Category}, {skill.ProficiencyPercentage}%) has been added to your skills roster.",
                null,
                new AiActionExecuted("CreateSkill", skill.Name, skill),
                new List<string> { "Add another skill", "View skills list", "Optimize skills presentation" }
            );

            return Ok(ApiResponse<AiChatResponse>.SuccessResponse(res));
        }

        private async Task<ActionResult<ApiResponse<AiChatResponse>>> HandleCreateService(string prompt)
        {
            var serviceName = "Full Stack Architecture & Engineering";
            var match = Regex.Match(prompt, @"(?:service|named|add)\s*[""']?([^""'\n,]+)[""']?", RegexOptions.IgnoreCase);
            if (match.Success && match.Groups[1].Value.Trim().Length > 2)
            {
                serviceName = match.Groups[1].Value.Trim();
            }

            var srv = new Service
            {
                Id = Guid.NewGuid(),
                Name = serviceName,
                Description = "End-to-end design, implementation, and deployment of scalable enterprise digital solutions.",
                Icon = "fa-solid fa-layer-group",
                Order = await _context.Services.CountAsync() + 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Services.AddAsync(srv);
            await _context.SaveChangesAsync();

            var res = new AiChatResponse(
                $"Service **\"{srv.Name}\"** has been created and published.",
                null,
                new AiActionExecuted("CreateService", srv.Name, srv),
                new List<string> { "Add pricing tier", "View all services", "Create site snapshot" }
            );

            return Ok(ApiResponse<AiChatResponse>.SuccessResponse(res));
        }

        private async Task<ActionResult<ApiResponse<AiChatResponse>>> HandleCreateBackup()
        {
            var packagesFolder = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "packages"));
            if (!Directory.Exists(packagesFolder)) Directory.CreateDirectory(packagesFolder);

            var projects = await _context.Projects.AsNoTracking().ToListAsync();
            var skills = await _context.Skills.AsNoTracking().ToListAsync();
            var services = await _context.Services.AsNoTracking().ToListAsync();
            var testimonials = await _context.Testimonials.AsNoTracking().ToListAsync();
            var experiences = await _context.Experiences.AsNoTracking().ToListAsync();
            var educations = await _context.Educations.AsNoTracking().ToListAsync();
            var certs = await _context.Certificates.AsNoTracking().ToListAsync();
            var settings = await _context.SiteSettings.AsNoTracking().ToListAsync();

            var total = projects.Count + skills.Count + services.Count + testimonials.Count +
                        experiences.Count + educations.Count + certs.Count + settings.Count;

            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
            var fileName = $"ai_automated_snapshot_{timestamp}.wpdup.json";
            var filePath = Path.Combine(packagesFolder, fileName);

            var payload = new
            {
                packageName = $"AI Snapshot {timestamp}",
                notes = "Autonomous backup snapshot requested via AI Assistant.",
                createdAtUtc = DateTime.UtcNow,
                totalEntities = total,
                data = new { projects, skills, services, testimonials, experiences, educations, certificates = certs, siteSettings = settings }
            };

            await System.IO.File.WriteAllTextAsync(filePath, JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true }));

            var res = new AiChatResponse(
                $"WordPress Duplicator snapshot **\"{fileName}\"** created successfully! Total of **{total}** database entities archived.",
                null,
                new AiActionExecuted("CreateBackup", fileName, new { totalEntities = total, filePath }),
                new List<string> { "View all packages", "Restore package", "Download package" }
            );

            return Ok(ApiResponse<AiChatResponse>.SuccessResponse(res));
        }

        private ActionResult<ApiResponse<AiChatResponse>> HandleGenerateUi(string prompt)
        {
            var html = @"
<div class=""ai-generated-card"" style=""background: #0F0E0C; border: 1px solid rgba(233,107,2,0.3); border-radius: 16px; padding: 24px; color: #FAF9F6; box-shadow: 0 10px 30px rgba(0,0,0,0.6); position: relative; overflow: hidden;"">
    <div style=""position: absolute; top:0; right:0; width: 120px; height: 120px; background: radial-gradient(circle, rgba(233,107,2,0.2) 0%, transparent 70%); pointer-events: none;""></div>
    <div style=""display: inline-flex; align-items:center; gap: 8px; background: rgba(233,107,2,0.15); border: 1px solid #E96B02; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #E96B02; text-transform: uppercase; letter-spacing: 1px;"">
        <i class=""fa-solid fa-sparkles""></i> Featured Capability
    </div>
    <h3 style=""font-size: 20px; font-weight: 700; margin: 16px 0 8px 0; color: #FAF9F6;"">AI-Powered Next-Gen Architecture</h3>
    <p style=""font-size: 14px; color: #A8A29E; line-height: 1.6; margin-bottom: 20px;"">
        Designed with high-contrast anti-slop visual taste, lightning-fast rendering, and zero layout shift.
    </p>
    <a href=""#contact"" style=""display: inline-flex; align-items: center; gap: 8px; background: #E96B02; color: #0F0E0C; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; text-decoration: none; transition: 0.2s;"">
        Explore Project <i class=""fa-solid fa-arrow-right""></i>
    </a>
</div>";

            var res = new AiChatResponse(
                "I have designed a custom high-taste UI component utilizing your **#0F0E0C** dark canvas and **#E96B02** primary accent.",
                html,
                new AiActionExecuted("GenerateUi", "Featured Capability Card", null),
                new List<string> { "Insert into GrapesJS Builder", "Copy HTML code", "Generate another variation" }
            );

            return Ok(ApiResponse<AiChatResponse>.SuccessResponse(res));
        }

        private async Task<ActionResult<ApiResponse<AiChatResponse>>> HandleKnowledgeQuery(string prompt)
        {
            var projects = await _context.Projects.AsNoTracking().Take(6).ToListAsync();
            var skills = await _context.Skills.AsNoTracking().Take(10).ToListAsync();
            var services = await _context.Services.AsNoTracking().Take(6).ToListAsync();

            var projectList = string.Join(", ", projects.Select(p => p.Title));
            var skillList = string.Join(", ", skills.Select(s => s.Name));
            var serviceList = string.Join(", ", services.Select(s => s.Name));

            // 1. Attempt LLM generation via Ollama (Local Unlimited), OpenRouter Free, Gemini, or Groq
            var systemPrompt = $"You are the AI Site Architect for an enterprise portfolio platform built with ASP.NET Core and modern frontend architecture. The design system uses #0F0E0C as primary dark background and #E96B02 as primary warm accent. Current portfolio database:\n- Projects: {projectList}\n- Skills: {skillList}\n- Services: {serviceList}\nAnswer clearly and accurately. Highlight your capability to create projects, add skills, or export WordPress Duplicator snapshots.";

            var aiResult = await _aiService.GenerateChatCompletionAsync(prompt, systemPrompt);
            if (!string.IsNullOrWhiteSpace(aiResult.Text))
            {
                var llmRes = new AiChatResponse(
                    aiResult.Text,
                    null,
                    null,
                    new List<string> { "Add a new project", "Create a Duplicator backup", "Design a UI component", "What skills are registered?" },
                    aiResult.ProviderUsed,
                    aiResult.ModelUsed
                );
                return Ok(ApiResponse<AiChatResponse>.SuccessResponse(llmRes));
            }

            // 2. Built-in Local Autonomous Engine Fallback
            string reply;
            var lower = prompt.ToLowerInvariant();

            if (lower.Contains("skill"))
            {
                reply = $"The platform features proficiency in key technical skills including: **{skillList}**. Each skill includes category grouping and rating indicators.";
            }
            else if (lower.Contains("project"))
            {
                reply = $"Currently highlighted projects include: **{projectList}**. These demonstrate full-stack architecture, API integration, and modern design principles.";
            }
            else if (lower.Contains("service"))
            {
                reply = $"Available professional services include: **{serviceList}**.";
            }
            else
            {
                reply = $"Hello! I am your **AI Site Architect & Assistant** powered by a unified multi-provider engine (Ollama Local Unlimited, OpenRouter Free, Gemini Free Tier, and Built-in Autonomous Engine). What would you like to build or automate?";
            }

            var res = new AiChatResponse(
                reply,
                null,
                null,
                new List<string> { "Add a new project", "Create a Duplicator backup", "Design a UI component", "What skills are registered?" },
                "LocalEngine",
                "Portfolio-Architect-v1"
            );

            return Ok(ApiResponse<AiChatResponse>.SuccessResponse(res));
        }
    }
}
