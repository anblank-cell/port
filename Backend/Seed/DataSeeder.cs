using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Backend.Data;
using Backend.Entities;

namespace Backend.Seed
{
    /// <summary>
    /// Static seeder that populates the database with essential default data on first run.
    /// Only executes inserts when the target data does not already exist — safe for repeated runs.
    /// </summary>
    public static class DataSeeder
    {
        /// <summary>
        /// Seeds the database with the default admin user and core site settings.
        /// Invoked once at application startup in the development or initial deploy environment.
        /// </summary>
        /// <param name="serviceProvider">The application DI service provider.</param>
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<PortfolioDbContext>>();

            try
            {
                // Ensure database tables are created and pending migrations applied
                try { await context.Database.MigrateAsync(); } catch {}
                await context.Database.EnsureCreatedAsync();

                await SeedAdminUserAsync(context, logger);
                await SeedSiteSettingsAsync(context, logger);
                await SeedHeroSectionAsync(context, logger);
                await SeedMenuItemsAsync(context, logger);
                await SeedSkillsAsync(context, logger);
                await SeedExperiencesAsync(context, logger);

                logger.LogInformation("Database seeding completed successfully.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred during database seeding.");
                throw;
            }
        }

        /// <summary>
        /// Seeds default menu items and menus container if none exist in the database.
        /// </summary>
        private static async Task SeedMenuItemsAsync(PortfolioDbContext context, ILogger logger)
        {
            try
            {
                // Ensure Menus table exists
                const string createMenusTableSql = @"
                    CREATE TABLE IF NOT EXISTS ""Menus"" (
                        ""Id"" TEXT NOT NULL CONSTRAINT ""PK_Menus"" PRIMARY KEY,
                        ""Name"" TEXT NOT NULL,
                        ""Slug"" TEXT NOT NULL,
                        ""Location"" TEXT NULL,
                        ""IsPrimary"" INTEGER NOT NULL DEFAULT 1,
                        ""IsDeleted"" INTEGER NOT NULL DEFAULT 0,
                        ""CreatedAt"" TEXT NOT NULL,
                        ""CreatedBy"" TEXT NULL,
                        ""UpdatedAt"" TEXT NULL,
                        ""UpdatedBy"" TEXT NULL,
                        ""DeletedAt"" TEXT NULL,
                        ""DeletedBy"" TEXT NULL
                    );";
                try { await context.Database.ExecuteSqlRawAsync(createMenusTableSql); } catch { }

                // Ensure MenuItems table exists
                const string createMenuItemsTableSql = @"
                    CREATE TABLE IF NOT EXISTS ""MenuItems"" (
                        ""Id"" TEXT NOT NULL CONSTRAINT ""PK_MenuItems"" PRIMARY KEY,
                        ""MenuId"" TEXT NULL,
                        ""Title"" TEXT NOT NULL,
                        ""Url"" TEXT NOT NULL,
                        ""Order"" INTEGER NOT NULL,
                        ""IsVisible"" INTEGER NOT NULL DEFAULT 1,
                        ""IsExternal"" INTEGER NOT NULL DEFAULT 0,
                        ""ParentId"" TEXT NULL,
                        ""IsDeleted"" INTEGER NOT NULL DEFAULT 0,
                        ""CreatedAt"" TEXT NOT NULL,
                        ""CreatedBy"" TEXT NULL,
                        ""UpdatedAt"" TEXT NULL,
                        ""UpdatedBy"" TEXT NULL,
                        ""DeletedAt"" TEXT NULL,
                        ""DeletedBy"" TEXT NULL
                    );";
                try { await context.Database.ExecuteSqlRawAsync(createMenuItemsTableSql); } catch { }

                // Add missing columns to existing tables
                try { await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""MenuItems"" ADD COLUMN ""ParentId"" TEXT NULL;"); } catch { }
                try { await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""MenuItems"" ADD COLUMN ""MenuId"" TEXT NULL;"); } catch { }

                // Ensure primary default menu exists
                if (!await context.Menus.IgnoreQueryFilters().AnyAsync())
                {
                    var primaryMenu = new Menu
                    {
                        Id = Guid.NewGuid(),
                        Name = "Primary Navigation Menu",
                        Slug = "primary-navigation",
                        Location = "header",
                        IsPrimary = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    await context.Menus.AddAsync(primaryMenu);
                    await context.SaveChangesAsync();

                    var defaultItems = new[]
                    {
                        new MenuItem { Id = Guid.NewGuid(), MenuId = primaryMenu.Id, Title = "Home",       Url = "#hero",       Order = 1, IsVisible = true, IsExternal = false, CreatedAt = DateTime.UtcNow },
                        new MenuItem { Id = Guid.NewGuid(), MenuId = primaryMenu.Id, Title = "Services",   Url = "#services",   Order = 2, IsVisible = true, IsExternal = false, CreatedAt = DateTime.UtcNow },
                        new MenuItem { Id = Guid.NewGuid(), MenuId = primaryMenu.Id, Title = "Projects",   Url = "#projects",   Order = 3, IsVisible = true, IsExternal = false, CreatedAt = DateTime.UtcNow },
                        new MenuItem { Id = Guid.NewGuid(), MenuId = primaryMenu.Id, Title = "Skills",     Url = "#skills",     Order = 4, IsVisible = true, IsExternal = false, CreatedAt = DateTime.UtcNow },
                        new MenuItem { Id = Guid.NewGuid(), MenuId = primaryMenu.Id, Title = "Experience", Url = "#experience", Order = 5, IsVisible = true, IsExternal = false, CreatedAt = DateTime.UtcNow },
                        new MenuItem { Id = Guid.NewGuid(), MenuId = primaryMenu.Id, Title = "Contact",    Url = "#contact",    Order = 6, IsVisible = true, IsExternal = false, CreatedAt = DateTime.UtcNow }
                    };

                    await context.MenuItems.AddRangeAsync(defaultItems);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Default primary menu and menu items seeded ({Count} entries).", defaultItems.Length);
                }
                else
                {
                    var primaryMenu = await context.Menus.IgnoreQueryFilters().FirstOrDefaultAsync(m => m.IsPrimary) 
                                      ?? await context.Menus.IgnoreQueryFilters().FirstOrDefaultAsync();
                    if (primaryMenu != null)
                    {
                        var orphanItems = await context.MenuItems.IgnoreQueryFilters().Where(m => m.MenuId == null).ToListAsync();
                        if (orphanItems.Any())
                        {
                            foreach (var item in orphanItems)
                            {
                                item.MenuId = primaryMenu.Id;
                            }
                            await context.SaveChangesAsync();
                        }
                    }
                }

                // Ensure deduplication in case multiple runs added duplicate items
                var allMenuItems = await context.MenuItems.IgnoreQueryFilters().ToListAsync();
                var duplicateItems = allMenuItems
                    .GroupBy(i => new { Title = i.Title.Trim().ToLower(), Url = i.Url.Trim().ToLower() })
                    .Where(g => g.Count() > 1)
                    .SelectMany(g => g.Skip(1))
                    .ToList();

                if (duplicateItems.Any())
                {
                    context.MenuItems.RemoveRange(duplicateItems);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Removed {Count} duplicate menu items from database.", duplicateItems.Count);
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not seed default menu items.");
            }
        }

        /// <summary>
        /// Seeds the default administrator user if no users exist in the database.
        /// </summary>
        private static async Task SeedAdminUserAsync(PortfolioDbContext context, ILogger logger)
        {
            if (await context.Users.IgnoreQueryFilters().AnyAsync())
            {
                logger.LogInformation("Admin user already exists — skipping user seed.");
                return;
            }

            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Portfolio Admin",
                Email = "admin@portfolio.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            };

            await context.Users.AddAsync(adminUser);
            await context.SaveChangesAsync();

            logger.LogInformation("Default admin user seeded: {Email}", adminUser.Email);
        }

        /// <summary>
        /// Seeds a set of default site settings if none exist.
        /// </summary>
        private static async Task SeedSiteSettingsAsync(PortfolioDbContext context, ILogger logger)
        {
            if (await context.SiteSettings.IgnoreQueryFilters().AnyAsync())
            {
                logger.LogInformation("Site settings already exist — skipping settings seed.");
                return;
            }

            var defaultSettings = new[]
            {
                new SiteSetting { Id = Guid.NewGuid(), Key = "site_name", Value = "My Portfolio", CreatedAt = DateTime.UtcNow },
                new SiteSetting { Id = Guid.NewGuid(), Key = "site_tagline", Value = "Building Exceptional Digital Experiences", CreatedAt = DateTime.UtcNow },
                new SiteSetting { Id = Guid.NewGuid(), Key = "contact_email", Value = "admin@portfolio.com", CreatedAt = DateTime.UtcNow },
                new SiteSetting { Id = Guid.NewGuid(), Key = "footer_text", Value = "© 2026 My Portfolio. All rights reserved.", CreatedAt = DateTime.UtcNow },
                new SiteSetting { Id = Guid.NewGuid(), Key = "maintenance_mode", Value = "false", CreatedAt = DateTime.UtcNow }
            };

            await context.SiteSettings.AddRangeAsync(defaultSettings);
            await context.SaveChangesAsync();

            logger.LogInformation("Default site settings seeded ({Count} entries).", defaultSettings.Length);
        }

        /// <summary>
        /// Seeds a placeholder hero section if none exists.
        /// </summary>
        private static async Task SeedHeroSectionAsync(PortfolioDbContext context, ILogger logger)
        {
            if (await context.HeroSections.IgnoreQueryFilters().AnyAsync())
            {
                logger.LogInformation("Hero section already exists — skipping hero seed.");
                return;
            }

            var hero = new HeroSection
            {
                Id = Guid.NewGuid(),
                Title = "Hi, I'm a Full Stack Developer",
                Subtitle = "Building scalable systems & beautiful interfaces",
                Description = "I design and build production-grade applications with clean architecture, premium UX, and enterprise security standards.",
                ProfileImageUrl = "/assets/images/profile.jpg",
                ResumeUrl = "/assets/files/resume.pdf",
                IsVisible = true,
                CreatedAt = DateTime.UtcNow
            };

            await context.HeroSections.AddAsync(hero);
            await context.SaveChangesAsync();

            logger.LogInformation("Default hero section seeded.");
        }

        /// <summary>
        /// Seeds a set of default skills if none exist.
        /// </summary>
        private static async Task SeedSkillsAsync(PortfolioDbContext context, ILogger logger)
        {
            if (await context.Skills.IgnoreQueryFilters().AnyAsync())
            {
                logger.LogInformation("Skills already exist — skipping skills seed.");
                return;
            }

            var defaultSkills = new[]
            {
                new Skill { Id = Guid.NewGuid(), Name = "React", Category = "Frontend", ProficiencyPercentage = 90, Icon = "fa-brands fa-react", Order = 1, CreatedAt = DateTime.UtcNow },
                new Skill { Id = Guid.NewGuid(), Name = "JavaScript / TypeScript", Category = "Frontend", ProficiencyPercentage = 95, Icon = "fa-brands fa-js", Order = 2, CreatedAt = DateTime.UtcNow },
                new Skill { Id = Guid.NewGuid(), Name = "HTML & CSS / Tailwind", Category = "Frontend", ProficiencyPercentage = 90, Icon = "fa-brands fa-css3-alt", Order = 3, CreatedAt = DateTime.UtcNow },
                new Skill { Id = Guid.NewGuid(), Name = "C# / .NET Core", Category = "Backend", ProficiencyPercentage = 92, Icon = "fa-solid fa-code", Order = 4, CreatedAt = DateTime.UtcNow },
                new Skill { Id = Guid.NewGuid(), Name = "PostgreSQL", Category = "Backend", ProficiencyPercentage = 85, Icon = "fa-solid fa-database", Order = 5, CreatedAt = DateTime.UtcNow },
                new Skill { Id = Guid.NewGuid(), Name = "Node.js", Category = "Backend", ProficiencyPercentage = 88, Icon = "fa-brands fa-node-js", Order = 6, CreatedAt = DateTime.UtcNow },
                new Skill { Id = Guid.NewGuid(), Name = "Docker", Category = "DevOps & Cloud", ProficiencyPercentage = 80, Icon = "fa-brands fa-docker", Order = 7, CreatedAt = DateTime.UtcNow },
                new Skill { Id = Guid.NewGuid(), Name = "AWS", Category = "DevOps & Cloud", ProficiencyPercentage = 78, Icon = "fa-brands fa-aws", Order = 8, CreatedAt = DateTime.UtcNow }
            };

            await context.Skills.AddRangeAsync(defaultSkills);
            await context.SaveChangesAsync();

            logger.LogInformation("Default skills seeded ({Count} entries).", defaultSkills.Length);
        }

        /// <summary>
        /// Seeds a set of default experiences if none exist.
        /// </summary>
        private static async Task SeedExperiencesAsync(PortfolioDbContext context, ILogger logger)
        {
            if (await context.Experiences.IgnoreQueryFilters().AnyAsync())
            {
                logger.LogInformation("Experiences already exist — skipping experiences seed.");
                return;
            }

            var defaultExperiences = new[]
            {
                new Experience
                {
                    Id = Guid.NewGuid(),
                    CompanyName = "Enterprise Solutions",
                    Role = "Senior Full Stack Developer",
                    Location = "Remote",
                    Description = "Led development of microservices architecture and designed elegant UI dashboards.",
                    StartDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    IsCurrent = true,
                    Order = 1,
                    CreatedAt = DateTime.UtcNow
                },
                new Experience
                {
                    Id = Guid.NewGuid(),
                    CompanyName = "Web Tech Labs",
                    Role = "Software Engineer",
                    Location = "New York",
                    Description = "Developed REST APIs and frontend features using React and .NET.",
                    StartDate = new DateTime(2021, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                    EndDate = new DateTime(2023, 12, 31, 0, 0, 0, DateTimeKind.Utc),
                    IsCurrent = false,
                    Order = 2,
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Experiences.AddRangeAsync(defaultExperiences);
            await context.SaveChangesAsync();

            logger.LogInformation("Default experiences seeded ({Count} entries).", defaultExperiences.Length);
        }
    }
}
