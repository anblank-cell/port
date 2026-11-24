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
    public class ServicesController : ControllerBase
    {
        private readonly IRepository<Service> _repository;

        public ServicesController(IRepository<Service> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<ServiceDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities
                .OrderBy(e => e.Order)
                .Select(e => new ServiceDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Description = e.Description,
                    Icon = e.Icon,
                    Order = e.Order
                });

            return Ok(ApiResponse<IEnumerable<ServiceDto>>.SuccessResponse(dtos));
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<ServiceDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<ServiceDto>.FailureResponse("Service not found"));

            var dto = new ServiceDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                Icon = entity.Icon,
                Order = entity.Order
            };

            return Ok(ApiResponse<ServiceDto>.SuccessResponse(dto));
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ServiceDto>>> Create([FromBody] CreateServiceDto dto)
        {
            var entity = new Service
            {
                Name = dto.Name,
                Description = dto.Description,
                Icon = dto.Icon,
                Order = dto.Order
            };

            var created = await _repository.AddAsync(entity);

            var resultDto = new ServiceDto
            {
                Id = created.Id,
                Name = created.Name,
                Description = created.Description,
                Icon = created.Icon,
                Order = created.Order
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<ServiceDto>.SuccessResponse(resultDto, "Service created successfully"));
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ServiceDto>>> Update(Guid id, [FromBody] UpdateServiceDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<ServiceDto>.FailureResponse("Service not found"));

            entity.Name = dto.Name;
            entity.Description = dto.Description;
            entity.Icon = dto.Icon;
            entity.Order = dto.Order;

            await _repository.UpdateAsync(entity);

            var resultDto = new ServiceDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                Icon = entity.Icon,
                Order = entity.Order
            };

            return Ok(ApiResponse<ServiceDto>.SuccessResponse(resultDto, "Service updated successfully"));
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Service not found"));

            await _repository.DeleteAsync(entity);

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Service deleted successfully"));
        }
    }
}
