using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Backend.Entities;

namespace Backend.Data
{
    /// <summary>
    /// Database context for the portfolio management system, configuring EF Core ORM mappings,
    /// dynamic query filters for soft deletes, and automatic auditing field updates.
    /// </summary>
    public class PortfolioDbContext : DbContext
    {
        /// <summary>Gets or sets the database representation of users.</summary>
        public DbSet<User> Users { get; set; }

        /// <summary>Gets or sets the database representation of refresh tokens.</summary>
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        /// <summary>Gets or sets the database representation of the hero section.</summary>
        public DbSet<HeroSection> HeroSections { get; set; }

        /// <summary>Gets or sets the database representation of portfolio projects.</summary>
        public DbSet<Project> Projects { get; set; }

        /// <summary>Gets or sets the database representation of professional services.</summary>
        public DbSet<Service> Services { get; set; }

        /// <summary>Gets or sets the database representation of skills.</summary>
        public DbSet<Skill> Skills { get; set; }

        /// <summary>Gets or sets the database representation of work experiences.</summary>
        public DbSet<Experience> Experiences { get; set; }

        /// <summary>Gets or sets the database representation of education records.</summary>
        public DbSet<Education> Educations { get; set; }

        /// <summary>Gets or sets the database representation of certificates.</summary>
        public DbSet<Certificate> Certificates { get; set; }

        /// <summary>Gets or sets the database representation of testimonials.</summary>
        public DbSet<Testimonial> Testimonials { get; set; }

        /// <summary>Gets or sets the database representation of social links.</summary>
        public DbSet<SocialLink> SocialLinks { get; set; }

        /// <summary>Gets or sets the database representation of statistics counters.</summary>
        public DbSet<Statistic> Statistics { get; set; }

        /// <summary>Gets or sets the database representation of contact form messages.</summary>
        public DbSet<ContactMessage> ContactMessages { get; set; }

        /// <summary>Gets or sets the database representation of site settings.</summary>
        public DbSet<SiteSetting> SiteSettings { get; set; }

        /// <summary>Gets or sets the database representation of navigation menu items.</summary>
        /// <summary>Gets or sets the database representation of navigation menu items.</summary>
        public DbSet<MenuItem> MenuItems { get; set; }

        /// <summary>Gets or sets the database representation of navigation menu containers.</summary>
        public DbSet<Menu> Menus { get; set; }

        /// <summary>Gets or sets the database representation of custom pages.</summary>
        public DbSet<Page> Pages { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="PortfolioDbContext"/> class.
        /// </summary>
        /// <param name="options">The context options.</param>
        public PortfolioDbContext(DbContextOptions<PortfolioDbContext> options) : base(options)
        {
        }

        /// <inheritdoc />
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User → RefreshTokens relationship and unique email index
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.HasMany(u => u.RefreshTokens)
                    .WithOne(rt => rt.User)
                    .HasForeignKey(rt => rt.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Enforce unique key constraint on SiteSetting
            modelBuilder.Entity<SiteSetting>(entity =>
            {
                entity.HasIndex(s => s.Key).IsUnique();
            });

            // Configure Menu → MenuItems relationship
            modelBuilder.Entity<Menu>(entity =>
            {
                entity.HasMany(m => m.Items)
                    .WithOne(mi => mi.Menu)
                    .HasForeignKey(mi => mi.MenuId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Register global soft-delete query filter for all entities inheriting from BaseEntity
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .HasQueryFilter(GetSoftDeleteFilter(entityType.ClrType));
                }
            }
        }

        /// <inheritdoc />
        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateAuditFields();
            return await base.SaveChangesAsync(cancellationToken);
        }

        /// <inheritdoc />
        public override int SaveChanges()
        {
            UpdateAuditFields();
            return base.SaveChanges();
        }

        /// <summary>
        /// Iterates through tracked entities and populates audit metadata (dates and creators).
        /// </summary>
        private void UpdateAuditFields()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is BaseEntity && (e.State == EntityState.Added || e.State == EntityState.Modified));

            foreach (var entry in entries)
            {
                var entity = (BaseEntity)entry.Entity;
                var now = DateTime.UtcNow;

                if (entry.State == EntityState.Added)
                {
                    entity.CreatedAt = now;
                    // CreatedBy can be populated here once user identity context is registered
                }
                else
                {
                    // Do not allow modified dates or creator to be changed on update
                    entry.Property(nameof(BaseEntity.CreatedAt)).IsModified = false;
                    entry.Property(nameof(BaseEntity.CreatedBy)).IsModified = false;
                    
                    entity.UpdatedAt = now;
                    // UpdatedBy can be populated here once user identity context is registered
                }
            }
        }

        /// <summary>
        /// Helper method compiling the dynamic LINQ expression used to filter out soft-deleted entities.
        /// </summary>
        /// <param name="type">The type of the target entity.</param>
        /// <returns>A lambda expression filtering by `IsDeleted == false`.</returns>
        private static LambdaExpression GetSoftDeleteFilter(Type type)
        {
            var parameter = Expression.Parameter(type, "e");
            var property = Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
            var condition = Expression.Equal(property, Expression.Constant(false));
            return Expression.Lambda(condition, parameter);
        }
    }
}
