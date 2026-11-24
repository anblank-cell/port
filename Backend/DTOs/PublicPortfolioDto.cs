using System.Collections.Generic;
using Backend.DTOs;

namespace Backend.DTOs
{
    public class PublicPortfolioDto
    {
        public HeroSectionDto? Hero { get; set; }
        public IEnumerable<ServiceDto> Services { get; set; } = new List<ServiceDto>();
        public IEnumerable<ProjectDto> Projects { get; set; } = new List<ProjectDto>();
        public Dictionary<string, List<SkillDto>> SkillsByCategory { get; set; } = new();
        public IEnumerable<ExperienceDto> Experience { get; set; } = new List<ExperienceDto>();
        public IEnumerable<EducationDto> Education { get; set; } = new List<EducationDto>();
        public IEnumerable<CertificateDto> Certificates { get; set; } = new List<CertificateDto>();
        public IEnumerable<TestimonialDto> Testimonials { get; set; } = new List<TestimonialDto>();
        public IEnumerable<StatisticDto> Statistics { get; set; } = new List<StatisticDto>();
        public IEnumerable<SocialLinkDto> SocialLinks { get; set; } = new List<SocialLinkDto>();
        public IEnumerable<MenuItemDto> MenuItems { get; set; } = new List<MenuItemDto>();
        public Dictionary<string, string> Settings { get; set; } = new();
    }
}
