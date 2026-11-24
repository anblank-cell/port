using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Backend.DTOs;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/uploads")]
    public class UploadsController : ControllerBase
    {
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg" };
        private readonly string[] _allowedFileExtensions = { 
            ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", 
            ".mp4", ".webm", ".ogv", ".mov", ".avi", ".mkv",
            ".mp3", ".wav", ".ogg",
            ".pdf", ".txt", ".zip", ".doc", ".docx", ".xls", ".xlsx" 
        };
        private const long MaxFileSize = 25 * 1024 * 1024; // 25 MB

        [HttpGet]
        [AllowAnonymous]
        public ActionResult<ApiResponse<IEnumerable<MediaFileDto>>> GetUploadedFiles()
        {
            try
            {
                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", "assets", "uploads");
                if (!Directory.Exists(uploadsDir))
                {
                    return Ok(ApiResponse<IEnumerable<MediaFileDto>>.SuccessResponse(Enumerable.Empty<MediaFileDto>()));
                }

                var files = Directory.GetFiles(uploadsDir)
                    .Select(filePath =>
                    {
                        var fileInfo = new FileInfo(filePath);
                        return new MediaFileDto
                        {
                            FileName = fileInfo.Name,
                            Url = $"/assets/uploads/{fileInfo.Name}",
                            FileSize = fileInfo.Length,
                            CreatedAt = fileInfo.CreationTimeUtc
                        };
                    })
                    .OrderByDescending(f => f.CreatedAt);

                return Ok(ApiResponse<IEnumerable<MediaFileDto>>.SuccessResponse(files));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<IEnumerable<MediaFileDto>>.FailureResponse($"Failed to list files: {ex.Message}"));
            }
        }

        [HttpPost("image")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<UploadResultDto>>> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<UploadResultDto>.FailureResponse("No file was uploaded."));
            }

            if (file.Length > MaxFileSize)
            {
                return BadRequest(ApiResponse<UploadResultDto>.FailureResponse("File size exceeds 10MB limit."));
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) || !_allowedExtensions.Contains(extension))
            {
                return BadRequest(ApiResponse<UploadResultDto>.FailureResponse("Invalid image format. Allowed formats: JPG, PNG, WEBP, GIF, SVG."));
            }

            return await SaveUploadedFileAsync(file, extension);
        }

        [HttpPost("file")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<UploadResultDto>>> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<UploadResultDto>.FailureResponse("No file was uploaded."));
            }

            if (file.Length > MaxFileSize)
            {
                return BadRequest(ApiResponse<UploadResultDto>.FailureResponse("File size exceeds 25MB limit."));
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) || !_allowedFileExtensions.Contains(extension))
            {
                return BadRequest(ApiResponse<UploadResultDto>.FailureResponse($"Invalid file format. Allowed formats: {string.Join(", ", _allowedFileExtensions)}"));
            }

            return await SaveUploadedFileAsync(file, extension);
        }

        [HttpDelete("{fileName}")]
        [Authorize]
        public ActionResult<ApiResponse<bool>> DeleteFile(string fileName)
        {
            try
            {
                var cleanName = Path.GetFileName(fileName);
                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", "assets", "uploads");
                var filePath = Path.Combine(uploadsDir, cleanName);

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    return Ok(ApiResponse<bool>.SuccessResponse(true, "File deleted successfully"));
                }
                return NotFound(ApiResponse<bool>.FailureResponse("File not found"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<bool>.FailureResponse($"Failed to delete file: {ex.Message}"));
            }
        }

        private async Task<ActionResult<ApiResponse<UploadResultDto>>> SaveUploadedFileAsync(IFormFile file, string extension)
        {
            try
            {
                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", "assets", "uploads");
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                var safeBaseName = Path.GetFileNameWithoutExtension(file.FileName)
                    .Replace(" ", "_")
                    .Replace("-", "_");
                
                // Keep name alphanumeric + underscores
                safeBaseName = new string(safeBaseName.Where(c => char.IsLetterOrDigit(c) || c == '_').ToArray());
                if (string.IsNullOrEmpty(safeBaseName)) safeBaseName = "file";

                var uniqueFileName = $"{safeBaseName}_{Guid.NewGuid().ToString().Substring(0, 6)}{extension}";
                var filePath = Path.Combine(uploadsDir, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var relativeUrl = $"/assets/uploads/{uniqueFileName}";

                var result = new UploadResultDto
                {
                    Url = relativeUrl,
                    FileName = uniqueFileName,
                    FileSize = file.Length
                };

                return Ok(ApiResponse<UploadResultDto>.SuccessResponse(result, "File uploaded successfully"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<UploadResultDto>.FailureResponse($"File upload failed: {ex.Message}"));
            }
        }
    }
}
