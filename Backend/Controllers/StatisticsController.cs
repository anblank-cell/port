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
    public class StatisticsController : ControllerBase
    {
        private readonly IRepository<Statistic> _repository;

        public StatisticsController(IRepository<Statistic> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<IEnumerable<StatisticDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities
                .OrderBy(e => e.Order)
                .Select(e => new StatisticDto
                {
                    Id = e.Id,
                    Label = e.Label,
                    Value = e.Value,
                    Icon = e.Icon,
                    Order = e.Order
                });

            return Ok(ApiResponse<IEnumerable<StatisticDto>>.SuccessResponse(dtos));
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<StatisticDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<StatisticDto>.FailureResponse("Statistic not found"));

            var dto = new StatisticDto
            {
                Id = entity.Id,
                Label = entity.Label,
                Value = entity.Value,
                Icon = entity.Icon,
                Order = entity.Order
            };

            return Ok(ApiResponse<StatisticDto>.SuccessResponse(dto));
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<StatisticDto>>> Create([FromBody] CreateStatisticDto dto)
        {
            var entity = new Statistic
            {
                Label = dto.Label,
                Value = dto.Value,
                Icon = dto.Icon,
                Order = dto.Order
            };

            var created = await _repository.AddAsync(entity);

            var resultDto = new StatisticDto
            {
                Id = created.Id,
                Label = created.Label,
                Value = created.Value,
                Icon = created.Icon,
                Order = created.Order
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<StatisticDto>.SuccessResponse(resultDto, "Statistic created successfully"));
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<StatisticDto>>> Update(Guid id, [FromBody] UpdateStatisticDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<StatisticDto>.FailureResponse("Statistic not found"));

            entity.Label = dto.Label;
            entity.Value = dto.Value;
            entity.Icon = dto.Icon;
            entity.Order = dto.Order;

            await _repository.UpdateAsync(entity);

            var resultDto = new StatisticDto
            {
                Id = entity.Id,
                Label = entity.Label,
                Value = entity.Value,
                Icon = entity.Icon,
                Order = entity.Order
            };

            return Ok(ApiResponse<StatisticDto>.SuccessResponse(resultDto, "Statistic updated successfully"));
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Statistic not found"));

            await _repository.DeleteAsync(entity);

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Statistic deleted successfully"));
        }
    }
}
