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

        public record AiChatRequest(string Message, string? Context, bool? IsAdmin, List<ChatMessage>? History);

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

            // ── Intent 6: Query / Profile Knowledge Base & Conversational Chat ───
            return await HandleKnowledgeQuery(prompt, request.History);
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

        private async Task<ActionResult<ApiResponse<AiChatResponse>>> HandleKnowledgeQuery(string prompt, List<ChatMessage>? history)
        {
            // ── Comprehensive Portfolio Knowledge Retrieval (RAG) ────────────
            var projects = await _context.Projects.AsNoTracking().Take(8).ToListAsync();
            var skills = await _context.Skills.AsNoTracking().Take(20).ToListAsync();
            var services = await _context.Services.AsNoTracking().Take(8).ToListAsync();
            var experiences = await _context.Experiences.AsNoTracking().Take(6).ToListAsync();
            var hero = await _context.HeroSections.AsNoTracking().FirstOrDefaultAsync();

            var heroProfile = hero != null 
                ? $"{hero.Title} - {hero.Subtitle}. {hero.Description}"
                : "Full-Stack Software Engineer & Solutions Architect";

            var detailedProjects = projects.Count > 0
                ? string.Join("\n", projects.Select(p => $"- **{p.Title}**: {p.Description} (Stack: {p.Technologies})"))
                : "- Enterprise Portfolio Platform (ASP.NET Core 8, EF Core, Vanilla JS, CSS3)";

            var detailedSkills = skills.Count > 0
                ? string.Join(", ", skills.Select(s => $"{s.Name} ({s.Category ?? "General"})"))
                : "C#, ASP.NET Core, EF Core, PostgreSQL, SQLite, JavaScript, REST APIs, System Architecture, UI/UX";

            var detailedServices = services.Count > 0
                ? string.Join("\n", services.Select(s => $"- **{s.Name}**: {s.Description}"))
                : "- Custom Full-Stack Web Development\n- Cloud Architecture & REST API Design\n- Database Modeling & Optimization";

            var detailedExperience = experiences.Count > 0
                ? string.Join("\n", experiences.Select(e => $"- **{e.Role}** at **{e.CompanyName}** ({e.StartDate:yyyy} - {(e.EndDate.HasValue ? e.EndDate.Value.ToString("yyyy") : "Present")}): {e.Description}"))
                : "- Senior Full-Stack Engineer: Leading enterprise software architecture, cloud microservices, and modern UI engineering.";

            // ── 1. Attempt LLM Generation (Gemini, Ollama, OpenRouter, Groq) ─
            var systemPrompt = $@"You are the AI Senior Principal Architect & Co-Pilot for this enterprise portfolio platform. You converse with the intelligence, nuance, and versatility of ChatGPT and Antigravity combined.

### CRITICAL ADAPTIVE CONVERSATIONAL PACING (FOLLOW STRICTLY):
1. **Casual Chit-Chat & Simple Greetings**:
   - If the user says simple greetings ('hello', 'hi', 'hey', 'what's up', 'how are you', 'sup', or casual pleasantries):
   - Respond in **1 or 2 natural, warm, conversational lines**! (Example: 'Hey there! Doing great and ready to build. How's your day going? 😊')
   - DO NOT dump long paragraphs, resumes, or unsolicited lists on simple greetings!

2. **In-Depth Explanations & Technical Architecture ('Explain how X works', 'How does blog work', 'Explain auth')**:
   - Give **rich, structured, multi-paragraph explanations**.
   - Explain the full stack: Frontend UI -> Backend Controller / Endpoint -> Database Schema / EF Core.
   - Clarify the design decisions, data flow, and performance considerations.

3. **Feature Brainstorming & Step-by-Step Code Generation ('I want to add X', 'Create a new functionality')**:
   - Offer creative architectural ideas.
   - Provide **complete, drop-in code snippets** (C#, HTML, JS) with exact placement instructions:
     * 'Step 1: Place this in Backend/... to handle the API route.'
     * 'Step 2: Place this in Frontend/... to render the UI.'
     * Explain: 'Once placed here, this does X and that does Y.'

4. **General Knowledge & Open Curiosity ('What's on the news today?', tech trends, concepts)**:
   - Answer directly and informatively with bulleted highlights, real-world context, and key takeaways—just like ChatGPT! Never say 'I can only talk about the portfolio'.

5. **Autonomous Actions & Component Creation**:
   - You have direct execution capabilities over this portfolio CMS:
     * Add or scaffold projects, skills, services
     * Create WordPress Duplicator backup packages
     * Design custom high-contrast UI components with #0F0E0C dark canvas & #E96B02 amber accent.

### Live Portfolio Knowledge Base Context:
- Hero / Profile: {heroProfile}
- Projects:
{detailedProjects}
- Skills:
{detailedSkills}
- Services:
{detailedServices}
- Work Experience:
{detailedExperience}
- Application Architecture: ASP.NET Core 8 Web API, EF Core (PostgreSQL & SQLite), JWT Authentication, WordPress Duplicator Engine, Vanilla JS & CSS3 with #0F0E0C & #E96B02 palette.";

            var aiResult = await _aiService.GenerateChatCompletionAsync(prompt, systemPrompt, history);
            if (!string.IsNullOrWhiteSpace(aiResult.Text))
            {
                var llmRes = new AiChatResponse(
                    aiResult.Text,
                    null,
                    null,
                    new List<string> { "Explain how this section works", "Add a new functionality", "Create a Duplicator backup", "Design a UI component" },
                    aiResult.ProviderUsed,
                    aiResult.ModelUsed
                );
                return Ok(ApiResponse<AiChatResponse>.SuccessResponse(llmRes));
            }

            // ── 2. Built-in Adaptive Fallback Engine (1-Liner for Chit-chat, Deep Paras for Topics) ──
            string reply;
            var lower = prompt.ToLowerInvariant().Trim();

            // Simple Greetings (1-Liner)
            if (lower is "hi" or "hello" or "hey" or "yo" or "howdy" or "hola")
            {
                reply = "Hey there! 👋 Doing great and ready to build. How's your day going?";
            }
            else if (lower.Contains("how are you") || lower.Contains("how r u") || lower.Contains("how're you"))
            {
                reply = "I'm doing fantastic, running smooth with 100% uptime! ⚡ What are we building or exploring today?";
            }
            else if (lower.Contains("what's up") || lower.Contains("whats up") || lower is "sup")
            {
                reply = "Not much, just ready to code, scaffold features, or answer any architectural questions! What's on your mind? 💡";
            }
            else if (lower.Contains("good morning") || lower.Contains("good afternoon") || lower.Contains("good evening"))
            {
                reply = "Good day to you! ☀️ Ready to dive in whenever you are. What should we tackle today?";
            }
            // News & Tech Highlights
            else if (lower.Contains("news") || lower.Contains("what's on news") || lower.Contains("whats on news") || lower.Contains("tech news") || lower.Contains("headlines"))
            {
                reply = "Here are the top highlighted developments in tech and software engineering today! 🌐📰\n\n### 1. Open-Weights & Local Reasoning AI\nOpen-weights models like DeepSeek-R1 and Meta's Llama 3.3 have dramatically reduced AI inference costs, enabling local desktop execution without subscription lock-in.\n\n### 2. Autonomous Agentic Engineering\nModern developer tooling has shifted toward fully autonomous agentic workflows where AI acts as a collaborative co-pilot that can edit files, compile backends, and run test suites directly in terminal sandboxes.\n\n### 3. .NET 8 / 9 Cloud-Native Maturity\nMicrosoft's latest .NET runtime advancements feature Native AOT compilation, 30% faster JSON serialization, and .NET Aspire for observable, production-ready distributed microservices.\n\n### 4. Edge Databases & Hybrid Sync\nServerless PostgreSQL providers (like Supabase) combined with local embedded SQLite engines are becoming the standard architecture for resilient, offline-first web platforms.\n\nCurious about any of these topics, or should we look into incorporating one into your portfolio?";
            }
            // Code & Section Explanations (How things work)
            else if (lower.Contains("how does") || lower.Contains("how do") || lower.Contains("code behind") || lower.Contains("how it works") || lower.Contains("explain how"))
            {
                if (lower.Contains("blog") || lower.Contains("post"))
                {
                    reply = "Here is how a **Blog or Article system** works from end to end in this architecture! 📝\n\n### 1. Database Layer (Entity Framework Core)\nIn `Backend/Entities/BlogPost.cs`, an entity defines `Id`, `Title`, `Slug`, `ContentHtml`, `PublishedAtUtc`, and `CoverImageUrl`. EF Core maps this to your PostgreSQL/SQLite database.\n\n### 2. Web API Controller Layer\nA controller (`Backend/Controllers/BlogController.cs`) exposes:\n- `GET /api/blog` - Returns paginated article summaries\n- `GET /api/blog/{slug}` - Returns full article content\n- `POST /api/blog` - (Admin only) Inserts new article via JWT authentication\n\n### 3. Frontend Client Layer\nIn `Frontend/assets/js/blog.js`, vanilla JS fetches the JSON payload from `/api/blog` and dynamically renders cards into the DOM with zero layout shift.\n\nWould you like me to generate the complete drop-in code to add this blog system right now? 🚀";
                }
                else if (lower.Contains("duplicator") || lower.Contains("backup"))
                {
                    reply = "Here is how the **WordPress Duplicator Engine** operates under the hood! 📦\n\n### 1. Autonomous Extraction\nWhen you trigger a snapshot, `Backend/Controllers/DuplicatorController.cs` queries all 8 core database tables (`Projects`, `Skills`, `Services`, `Experiences`, `Educations`, `Testimonials`, `Certificates`, `SiteSettings`) using EF Core `.AsNoTracking()` for optimal speed.\n\n### 2. Snapshot Serialization & Archival\nThe records are serialized into a structured `.wpdup.json` archive with metadata, timestamps, and schema definitions, then saved to `/packages/`.\n\n### 3. One-Click Restoration\nWhen restored, the engine validates the package integrity, performs transactional bulk-upserts, and synchronizes your entire portfolio in milliseconds!\n\nWant me to trigger an automated snapshot right now? Just type *'Create backup'*! ⚡";
                }
                else
                {
                    reply = "Here is how the **end-to-end data pipeline** functions across any section in your portfolio platform! 🏛️\n\n### 1. The Frontend Presentation Layer\nSemantic HTML components in `Frontend/index.html` render using CSS variables (`#0F0E0C` dark base and `#E96B02` amber accent). Modular JavaScript files (e.g. `Frontend/assets/js/portfolio.js`) dispatch asynchronous `fetch()` requests to the backend.\n\n### 2. The ASP.NET Core 8 Web API\nIncoming requests hit strongly-typed controllers in `Backend/Controllers/`. The controllers handle validation, JWT token authorization, and dependency injection.\n\n### 3. Entity Framework Core & Supabase/SQLite\nControllers query `PortfolioDbContext`, which communicates with PostgreSQL (Supabase cloud) or local SQLite. Responses are wrapped in a unified `ApiResponse<T>` envelope.\n\nWhich specific section or component would you like to examine or modify?";
                }
            }
            // Feature Brainstorming & Ready-to-use Drop-in Code
            else if (lower.Contains("add a") || lower.Contains("add new") || lower.Contains("new functionality") || lower.Contains("create something new") || lower.Contains("help me build") || lower.Contains("give me code"))
            {
                reply = "Let's build it! 💡 Here is the complete, drop-in implementation for adding a **Live Visitor Testimonials Submission Form** with real-time database persistence!\n\n### Step 1: Add this API Endpoint in `Backend/Controllers/TestimonialsController.cs`\n```csharp\n[HttpPost(\"submit\")]\n[AllowAnonymous]\npublic async Task<ActionResult<ApiResponse<Testimonial>>> SubmitTestimonial([FromBody] CreateTestimonialDto dto)\n{\n    var testimonial = new Testimonial\n    {\n        AuthorName = dto.AuthorName,\n        AuthorTitle = dto.AuthorTitle,\n        Content = dto.Content,\n        Rating = Math.Clamp(dto.Rating, 1, 5),\n        IsApproved = false // Set to true after admin review\n    };\n    _context.Testimonials.Add(testimonial);\n    await _context.SaveChangesAsync();\n    return Ok(ApiResponse<Testimonial>.SuccessResponse(testimonial, \"Testimonial submitted!\"));\n}\n```\n\n### Step 2: Place this UI & Script in `Frontend/index.html`\n```html\n<div class=\"testimonial-box\" style=\"background:#0F0E0C; border:1px solid rgba(233,107,2,0.3); border-radius:12px; padding:20px;\">\n    <h4 style=\"color:#FAF9F6; margin-bottom:12px;\">Leave a Testimonial</h4>\n    <input id=\"t-author\" placeholder=\"Your Name\" style=\"width:100%; background:#171512; border:1px solid rgba(233,107,2,0.25); color:#FAF9F6; padding:8px 12px; border-radius:6px; margin-bottom:8px;\" />\n    <textarea id=\"t-content\" placeholder=\"Your Feedback...\" style=\"width:100%; background:#171512; border:1px solid rgba(233,107,2,0.25); color:#FAF9F6; padding:8px 12px; border-radius:6px; margin-bottom:8px;\"></textarea>\n    <button onclick=\"submitReview()\" style=\"background:#E96B02; color:#0F0E0C; font-weight:bold; padding:8px 16px; border-radius:6px; border:none; cursor:pointer;\">Submit</button>\n</div>\n```\n\nPlace the C# code in your controller and the HTML in your frontend—it will connect immediately to your database! Want me to scaffold another feature?";
            }
            else if (lower.Contains("who are you") || lower.Contains("what are you") || lower.Contains("tell me about yourself"))
            {
                reply = "Think of me as your personal **ChatGPT + Senior Lead Architect** embedded directly inside your portfolio platform! 🛠️✨\n\n### What I Can Do For You:\n- 🚀 **Autonomous Project Scaffolding**: Tell me about an app idea, and I'll immediately register it in the database with titles, tags, and descriptions.\n- ⚡ **Skills & Competencies Rostering**: Add backend, frontend, devops, or AI skills with live database synchronization.\n- 📦 **WordPress Duplicator Engine**: Create one-click compressed backup snapshots of your entire portfolio data, ready for export or migration.\n- 🎨 **High-Taste UI Generation**: Generate custom, responsive UI cards and layouts styled with our signature **#0F0E0C** dark canvas and **#E96B02** warm accent.\n- 💬 **Architectural Brainstorming**: Discuss software engineering patterns, Clean Architecture, REST API design, caching, and scalable infrastructure.\n\nWhat would you like to explore or automate right now?";
            }
            else if (lower.Contains("datacenter") || lower.Contains("data center") || lower.Contains("data-center") || lower.Contains("google"))
            {
                reply = "You can connect this portfolio directly to Google's AI data centers right now for FREE! 🚀\n\n1. Head over to **[Google AI Studio](https://aistudio.google.com)** and grab a free API key (zero cost, 1,500 free requests/day).\n2. Open `Backend/appsettings.json` and paste your key into `\"GeminiApiKey\": \"YOUR_KEY\"`.\n3. Instantly, every prompt you send here calls Google's **Gemini 1.5 Flash** models running directly on Google's Tensor Processing Units (TPUs) across Google data centers worldwide!";
            }
            else if (lower.Contains("architecture") || lower.Contains("system design") || lower.Contains("backend"))
            {
                reply = "Here is a breakdown of the **robust architecture** powering this entire platform! 🏛️\n\n### 1. Backend Core (ASP.NET Core 8 Web API)\n- **Clean Architecture & Repository Pattern**: Clean separation of concerns with domain entities, repositories, and strongly typed controllers.\n- **Entity Framework Core ORM**: Dual-engine database design supporting PostgreSQL on Supabase Cloud and local SQLite with automated auditing and soft-deletion filters.\n- **Security Infrastructure**: JWT Bearer token authentication, refresh token rotation, and BCrypt password encryption.\n\n### 2. Autonomous AI Co-Pilot & WordPress Duplicator\n- **Multi-Provider AI Fallback**: Integrates Ollama (local unlimited), Google Gemini (free cloud), Groq (high-speed), and this built-in autonomous engine.\n- **Duplicator Engine**: Creates standalone JSON database packages and exportable packages mimicking WordPress Duplicator architecture.\n\n### 3. Frontend Experience\n- Responsive, modern vanilla JavaScript and CSS3 architecture adhering to the brand palette: **#0F0E0C** dark canvas and **#E96B02** warm accent.\n\nWould you like to examine or extend any of these subsystems? 🛠️";
            }
            else if (lower.Contains("skill") || lower.Contains("tech stack") || lower.Contains("technologies"))
            {
                reply = $"Here is the full technical stack currently registered in your portfolio database:\n\n⚡ **{detailedSkills}**\n\nWould you like me to add a new skill to the database (e.g. `+ Add skill: Docker / DevOps`), or adjust categories and proficiency levels? 🎯";
            }
            else if (lower.Contains("project") || lower.Contains("portfolio") || lower.Contains("work"))
            {
                reply = $"Here are the featured engineering projects currently showcased in your database:\n\n{detailedProjects}\n\nWould you like me to create a new project in your database right now? Just type:\n`Add project: [Project Title]` and I will scaffold it instantly! 🌟";
            }
            else if (lower.Contains("experience") || lower.Contains("career") || lower.Contains("history") || lower.Contains("background"))
            {
                reply = $"Here is the career trajectory and work history recorded in the database:\n\n{detailedExperience}\n\nWould you like me to register a new career milestone or draft an expanded case study? 💼";
            }
            else if (lower.Contains("service") || lower.Contains("offer") || lower.Contains("pricing"))
            {
                reply = $"Here are the professional engineering services offered through this platform:\n\n{detailedServices}\n\nFrom high-throughput backend architecture to intuitive frontend UI/UX and database migrations. Would you like to introduce a new service package? 🛠️";
            }
            else if (lower.Contains("joke") || lower.Contains("funny") || lower.Contains("laugh"))
            {
                var jokes = new[]
                {
                    "Why do programmers prefer dark mode (**#0F0E0C**)? Because light attracts bugs! 🐛😄",
                    "There are only 10 types of people in the world: those who understand binary, and those who don't! 💻",
                    "A SQL query walks into a bar, walks up to two tables and asks: *'Can I join you?'* 🍻😂",
                    "Why did the developer go broke? Because they used up all their cache! 💸😆",
                    "How many programmers does it take to change a light bulb? None, that's a hardware problem! 💡⚡"
                };
                var randomJoke = jokes[new Random().Next(jokes.Length)];
                reply = $"{randomJoke}\n\nGot any other questions or projects we should tackle today? 🚀";
            }
            else if (lower.Contains("thank") || lower.Contains("thanks") || lower.Contains("awesome") || lower.Contains("cool") || lower.Contains("great"))
            {
                reply = "You're very welcome! 🙌 Ready whenever you need code, architecture ideas, or direct database actions.";
            }
            else
            {
                reply = $"That's a great thought! 💡 As your **AI Site Architect**, I can dive deep into technical system design, brainstorm architectural strategies, or execute direct changes to your portfolio.\n\n### Here is what we can do next:\n- 🚀 **Scaffold a new project**: Tell me the title and tech stack, and I'll create it.\n- 📦 **Create a site backup**: Type *'Backup site'* for an instant WordPress Duplicator snapshot.\n- 🎨 **Generate high-taste UI**: Ask me to design a new component with **#0F0E0C** & **#E96B02** styling.\n- ⚡ **Connect Google Gemini Cloud**: Add your free Gemini API key to `appsettings.json` for full Google data center AI reasoning!\n\nTell me which direction you'd like to take! 🛠️";
            }

            var res = new AiChatResponse(
                reply,
                null,
                null,
                new List<string> { "Explain how blog works", "Give me code to add a feature", "What's on the news today?", "Create a Duplicator backup" },
                "LocalEngine",
                "Portfolio-Architect-v1"
            );

            return Ok(ApiResponse<AiChatResponse>.SuccessResponse(res));
        }
    }
}
