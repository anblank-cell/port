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
    public class ContactMessagesController : ControllerBase
    {
        private readonly IRepository<ContactMessage> _repository;
        private readonly IEmailService _emailService;

        public ContactMessagesController(IRepository<ContactMessage> repository, IEmailService emailService)
        {
            _repository = repository;
            _emailService = emailService;
        }

        /// <summary>
        /// Get all contact messages (admin only).
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<ApiResponse<IEnumerable<ContactMessageDto>>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => new ContactMessageDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Email = e.Email,
                    Subject = e.Subject,
                    Message = e.Message,
                    IsRead = e.IsRead,
                    CreatedAt = e.CreatedAt
                });

            return Ok(ApiResponse<IEnumerable<ContactMessageDto>>.SuccessResponse(dtos));
        }

        /// <summary>
        /// Get unread contact messages count (admin only).
        /// </summary>
        [HttpGet("unread-count")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
        {
            var entities = await _repository.GetAllAsync();
            var count = entities.Count(e => !e.IsRead);

            return Ok(ApiResponse<int>.SuccessResponse(count));
        }

        /// <summary>
        /// Get contact message by ID (admin only).
        /// </summary>
        [HttpGet("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ContactMessageDto>>> GetById(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<ContactMessageDto>.FailureResponse("Contact message not found"));

            var dto = new ContactMessageDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Email = entity.Email,
                Subject = entity.Subject,
                Message = entity.Message,
                IsRead = entity.IsRead,
                CreatedAt = entity.CreatedAt
            };

            return Ok(ApiResponse<ContactMessageDto>.SuccessResponse(dto));
        }

        /// <summary>
        /// Submit a new contact message from the public form.
        /// Public endpoint - no authentication required.
        /// </summary>
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<ContactMessageDto>>> Create([FromBody] CreateContactMessageDto dto)
        {
            var entity = new ContactMessage
            {
                Name = dto.Name,
                Email = dto.Email,
                Subject = dto.Subject,
                Message = dto.Message,
                IsRead = false
            };

            var created = await _repository.AddAsync(entity);

            // Fire-and-forget email notifications (logs errors internally without failing the HTTP response)
            _ = Task.Run(async () =>
            {
                await _emailService.SendContactNotificationAsync(created.Name ?? string.Empty, created.Email ?? string.Empty, created.Subject ?? string.Empty, created.Message ?? string.Empty);
                await _emailService.SendAutoReplyAsync(created.Email ?? string.Empty, created.Name ?? string.Empty);
            });

            var resultDto = new ContactMessageDto
            {
                Id = created.Id,
                Name = created.Name,
                Email = created.Email,
                Subject = created.Subject,
                Message = created.Message,
                IsRead = created.IsRead,
                CreatedAt = created.CreatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, 
                ApiResponse<ContactMessageDto>.SuccessResponse(resultDto, "Message sent successfully"));
        }

        /// <summary>
        /// Mark a contact message as read/unread (admin only).
        /// </summary>
        [HttpPatch("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ContactMessageDto>>> UpdateReadStatus(Guid id, [FromBody] UpdateContactMessageDto dto)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<ContactMessageDto>.FailureResponse("Contact message not found"));

            entity.IsRead = dto.IsRead;

            await _repository.UpdateAsync(entity);

            var resultDto = new ContactMessageDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Email = entity.Email,
                Subject = entity.Subject,
                Message = entity.Message,
                IsRead = entity.IsRead,
                CreatedAt = entity.CreatedAt
            };

            return Ok(ApiResponse<ContactMessageDto>.SuccessResponse(resultDto, "Message status updated successfully"));
        }

        /// <summary>
        /// Delete a contact message (admin only, soft delete).
        /// </summary>
        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
                return NotFound(ApiResponse<object>.FailureResponse("Contact message not found"));

            await _repository.DeleteAsync(entity);

            return Ok(ApiResponse<object>.SuccessResponse(new { }, "Message deleted successfully"));
        }
    }
}
