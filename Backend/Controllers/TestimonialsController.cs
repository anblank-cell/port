using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestimonialsController : ControllerBase
    {
        private readonly IRepository<Testimonial> _repository;

        public TestimonialsController(IRepository<Testimonial> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<TestimonialDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities
                .OrderBy(e => e.Order)
                .Select(e => new TestimonialDto
                {
                    Id = e.Id,
                    ClientName = e.ClientName,
                    ClientRole = e.ClientRole,
                    CompanyName = e.CompanyName,
                    Feedback = e.Feedback,
                    ClientImageUrl = e.ClientImageUrl,
                    Order = e.Order
                });

            return Ok(ApiResponse<IEnumerable<TestimonialDto>>.SuccessResponse(dtos));
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<TestimonialDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<TestimonialDto>.FailureResponse("Testimonial not found"));

            var dto = new TestimonialDto
            {
                Id = entity.Id,
                ClientName = entity.ClientName,
                ClientRole = entity.ClientRole,
                CompanyName = entity.CompanyName,
                Feedback = entity.Feedback,
                ClientImageUrl = entity.ClientImageUrl,
                Order = entity.Order
            };

            return Ok(ApiResponse<TestimonialDto>.SuccessResponse(dto));
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<TestimonialDto>>> Create([FromBody] CreateTestimonialDto dto)
        {
            var entity = new Testimonial
            {
                ClientName = dto.ClientName,
                ClientRole = dto.ClientRole,
                CompanyName = dto.CompanyName,
                Feedback = dto.Feedback,
                ClientImageUrl = dto.ClientImageUrl,
                Order = dto.Order
            };

            var created = await _repository.AddAsync(entity);

            var resultDto = new TestimonialDto
            {
                Id = created.Id,
                ClientName = created.ClientName,
                ClientRole = created.ClientRole,
                CompanyName = created.CompanyName,
                Feedback = created.Feedback,
                ClientImageUrl = created.ClientImageUrl,
                Order = created.Order
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<TestimonialDto>.SuccessResponse(resultDto, "Testimonial created successfully"));
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<TestimonialDto>>> Update(Guid id, [FromBody] UpdateTestimonialDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<TestimonialDto>.FailureResponse("Testimonial not found"));

            entity.ClientName = dto.ClientName;
            entity.ClientRole = dto.ClientRole;
            entity.CompanyName = dto.CompanyName;
            entity.Feedback = dto.Feedback;
            entity.ClientImageUrl = dto.ClientImageUrl;
            entity.Order = dto.Order;

            await _repository.UpdateAsync(entity);

            var resultDto = new TestimonialDto
            {
                Id = entity.Id,
                ClientName = entity.ClientName,
                ClientRole = entity.ClientRole,
                CompanyName = entity.CompanyName,
                Feedback = entity.Feedback,
                ClientImageUrl = entity.ClientImageUrl,
                Order = entity.Order
            };

            return Ok(ApiResponse<TestimonialDto>.SuccessResponse(resultDto, "Testimonial updated successfully"));
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Testimonial not found"));

            await _repository.DeleteAsync(entity);

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Testimonial deleted successfully"));
        }
    }
}
