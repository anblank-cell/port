using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;

namespace Backend.Controllers
{
    [ApiController]
    [AllowAnonymous]
    public class SeoController : ControllerBase
    {
        private readonly PortfolioDbContext _context;

        public SeoController(PortfolioDbContext context)
        {
            _context = context;
        }

        [HttpGet("/sitemap.xml")]
        [Produces("application/xml")]
        public async Task<IActionResult> GetSitemap()
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var projects = await _context.Projects.AsNoTracking().ToListAsync();

            XNamespace ns = "http://www.sitemaps.org/schemas/sitemap/0.9";
            var root = new XElement(ns + "urlset");

            // Static Top-Level Pages
            root.Add(new XElement(ns + "url",
                new XElement(ns + "loc", $"{baseUrl}/"),
                new XElement(ns + "lastmod", DateTime.UtcNow.ToString("yyyy-MM-dd")),
                new XElement(ns + "changefreq", "weekly"),
                new XElement(ns + "priority", "1.0")
            ));

            // Dynamic Projects
            foreach (var p in projects)
            {
                var modDate = (p.UpdatedAt ?? p.CreatedAt).ToString("yyyy-MM-dd");
                root.Add(new XElement(ns + "url",
                    new XElement(ns + "loc", $"{baseUrl}/#projects"),
                    new XElement(ns + "lastmod", modDate),
                    new XElement(ns + "changefreq", "monthly"),
                    new XElement(ns + "priority", p.IsFeatured ? "0.9" : "0.7")
                ));
            }

            var doc = new XDocument(new XDeclaration("1.0", "utf-8", "yes"), root);
            return Content(doc.ToString(), "application/xml", Encoding.UTF8);
        }

        [HttpGet("/feed.xml")]
        [HttpGet("/rss.xml")]
        [Produces("application/rss+xml")]
        public async Task<IActionResult> GetRssFeed()
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var projects = await _context.Projects.AsNoTracking().OrderByDescending(p => p.CreatedAt).Take(20).ToListAsync();

            var channel = new XElement("channel",
                new XElement("title", "Portfolio Projects & Engineering Feed"),
                new XElement("link", baseUrl),
                new XElement("description", "Latest full-stack software engineering projects and technical releases."),
                new XElement("language", "en-us"),
                new XElement("lastBuildDate", DateTime.UtcNow.ToString("R"))
            );

            foreach (var p in projects)
            {
                channel.Add(new XElement("item",
                    new XElement("title", p.Title),
                    new XElement("description", p.Description),
                    new XElement("link", p.ProjectUrl ?? $"{baseUrl}/#projects"),
                    new XElement("guid", p.Id.ToString()),
                    new XElement("pubDate", p.CreatedAt.ToString("R"))
                ));
            }

            var rss = new XElement("rss", new XAttribute("version", "2.0"), channel);
            var doc = new XDocument(new XDeclaration("1.0", "utf-8", "yes"), rss);
            return Content(doc.ToString(), "application/rss+xml", Encoding.UTF8);
        }

        [HttpGet("/robots.txt")]
        [Produces("text/plain")]
        public IActionResult GetRobotsTxt()
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var sb = new StringBuilder();
            sb.AppendLine("User-agent: *");
            sb.AppendLine("Allow: /");
            sb.AppendLine("Disallow: /admin/");
            sb.AppendLine("Disallow: /api/");
            sb.AppendLine();
            sb.AppendLine($"Sitemap: {baseUrl}/sitemap.xml");

            return Content(sb.ToString(), "text/plain", Encoding.UTF8);
        }
    }
}
