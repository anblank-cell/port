using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using System.Text;

namespace Backend.Controllers
{
    /// <summary>
    /// FileSystem Controller — Secure file browser and editor for the admin panel.
    /// All file operations are sandboxed within the configured Frontend root directory.
    /// Requires authentication for all write operations; browse/read are admin-only.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FileSystemController : ControllerBase
    {
        // The root directory exposed to the admin file organizer.
        // All paths are resolved relative to this root and validated to prevent traversal.
        private static readonly string _rootPath = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Frontend")
        );

        // File extensions that are considered text/editable
        private static readonly HashSet<string> _editableExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".html", ".css", ".js", ".json", ".md", ".txt", ".ts", ".jsx", ".tsx",
            ".xml", ".svg", ".yml", ".yaml", ".env", ".cs", ".csproj", ".gitignore"
        };

        // File extensions to treat as binary / non-editable
        private static readonly HashSet<string> _binaryExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2",
            ".ttf", ".eot", ".otf", ".pdf", ".zip", ".gz", ".exe", ".dll", ".db"
        };

        // ─── DTOs (inline — small enough to keep in controller) ───────────────

        public record FileNodeDto(
            string Name,
            string RelativePath,
            bool IsDirectory,
            long? SizeBytes,
            string? SizeFormatted,
            DateTime ModifiedAt,
            string ModifiedFormatted,
            string Extension,
            bool IsEditable,
            string Kind
        );

        public record ReadFileDto(string RelativePath, string Content, string Extension, bool IsEditable);

        public record WriteFileRequest(string RelativePath, string Content);

        public record CreateItemRequest(string RelativePath, bool IsDirectory);

        public record RenameItemRequest(string RelativePath, string NewName);

        public record DeleteItemRequest(string RelativePath);

        // ─── Helpers ──────────────────────────────────────────────────────────

        /// <summary>Resolves a relative path to an absolute path and validates it stays within root.</summary>
        private ActionResult<string> ResolveSafe(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                relativePath = "";

            // Normalize slashes, strip leading separator
            relativePath = relativePath.Replace('\\', '/').TrimStart('/');

            var fullPath = Path.GetFullPath(Path.Combine(_rootPath, relativePath));

            // Security: ensure path is within root
            if (!fullPath.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
                return BadRequest(ApiResponse<string>.FailureResponse("Path traversal detected."));

            return fullPath;
        }

        private static string FormatSize(long bytes)
        {
            if (bytes < 1024) return $"{bytes} B";
            if (bytes < 1024 * 1024) return $"{bytes / 1024.0:0.#} KB";
            return $"{bytes / (1024.0 * 1024):0.##} MB";
        }

        private static string GetKind(string path)
        {
            if (Directory.Exists(path)) return "Folder";
            var ext = Path.GetExtension(path).ToLowerInvariant();
            return ext switch
            {
                ".html" => "HTML File",
                ".css"  => "CSS File",
                ".js"   => "JavaScript File",
                ".ts"   => "TypeScript File",
                ".json" => "JSON File",
                ".md"   => "Markdown File",
                ".png" or ".jpg" or ".jpeg" or ".gif" or ".webp" or ".svg" or ".ico" => "Image File",
                ".pdf"  => "PDF File",
                ".txt"  => "Text File",
                ".cs"   => "C# File",
                ".xml"  => "XML File",
                _       => $"{(ext.Length > 1 ? ext[1..].ToUpperInvariant() : "Unknown")} File"
            };
        }

        private static FileNodeDto BuildNode(FileSystemInfo info)
        {
            var isDir   = info is DirectoryInfo;
            var ext     = isDir ? "" : Path.GetExtension(info.Name);
            var isEditable = !isDir && _editableExtensions.Contains(ext);
            long? size  = isDir ? null : ((FileInfo)info).Length;

            return new FileNodeDto(
                Name:             info.Name,
                RelativePath:     Path.GetRelativePath(_rootPath, info.FullName).Replace('\\', '/'),
                IsDirectory:      isDir,
                SizeBytes:        size,
                SizeFormatted:    size.HasValue ? FormatSize(size.Value) : null,
                ModifiedAt:       info.LastWriteTimeUtc,
                ModifiedFormatted: info.LastWriteTime.ToString("MMM dd, yyyy hh:mm tt"),
                Extension:        ext.ToLowerInvariant(),
                IsEditable:       isEditable,
                Kind:             GetKind(info.FullName)
            );
        }

        // ─── Endpoints ────────────────────────────────────────────────────────

        /// <summary>
        /// GET /api/filesystem/browse?path=
        /// Returns the direct children of the given directory path.
        /// </summary>
        [HttpGet("browse")]
        public ActionResult<ApiResponse<IEnumerable<FileNodeDto>>> Browse([FromQuery] string? path = "")
        {
            var resolved = ResolveSafe(path);
            if (resolved.Result != null) return resolved.Result!;
            var fullPath = resolved.Value!;

            if (!Directory.Exists(fullPath))
                return NotFound(ApiResponse<IEnumerable<FileNodeDto>>.FailureResponse("Directory not found."));

            try
            {
                var entries = new DirectoryInfo(fullPath)
                    .GetFileSystemInfos()
                    .Where(e => !e.Name.StartsWith('.') && e.Name != "node_modules" && e.Name != "bin" && e.Name != "obj")
                    .OrderByDescending(e => e is DirectoryInfo)
                    .ThenBy(e => e.Name, StringComparer.OrdinalIgnoreCase)
                    .Select(BuildNode);

                return Ok(ApiResponse<IEnumerable<FileNodeDto>>.SuccessResponse(entries));
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403, ApiResponse<IEnumerable<FileNodeDto>>.FailureResponse("Access denied."));
            }
        }

        /// <summary>
        /// GET /api/filesystem/read?path=
        /// Returns the text content of a file.
        /// </summary>
        [HttpGet("read")]
        public async Task<ActionResult<ApiResponse<ReadFileDto>>> ReadFile([FromQuery] string path)
        {
            var resolved = ResolveSafe(path);
            if (resolved.Result != null) return resolved.Result!;
            var fullPath = resolved.Value!;

            if (!System.IO.File.Exists(fullPath))
                return NotFound(ApiResponse<ReadFileDto>.FailureResponse("File not found."));

            var ext = Path.GetExtension(fullPath);

            if (_binaryExtensions.Contains(ext))
                return BadRequest(ApiResponse<ReadFileDto>.FailureResponse("Binary files cannot be opened in the editor."));

            try
            {
                var content = await System.IO.File.ReadAllTextAsync(fullPath, Encoding.UTF8);
                var dto = new ReadFileDto(
                    RelativePath: Path.GetRelativePath(_rootPath, fullPath).Replace('\\', '/'),
                    Content: content,
                    Extension: ext.ToLowerInvariant(),
                    IsEditable: _editableExtensions.Contains(ext)
                );
                return Ok(ApiResponse<ReadFileDto>.SuccessResponse(dto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<ReadFileDto>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// POST /api/filesystem/write
        /// Writes text content to a file (creates or overwrites).
        /// </summary>
        [HttpPost("write")]
        public async Task<ActionResult<ApiResponse<string>>> WriteFile([FromBody] WriteFileRequest request)
        {
            var resolved = ResolveSafe(request.RelativePath);
            if (resolved.Result != null) return resolved.Result!;
            var fullPath = resolved.Value!;

            var ext = Path.GetExtension(fullPath);
            if (_binaryExtensions.Contains(ext))
                return BadRequest(ApiResponse<string>.FailureResponse("Cannot write binary file types."));

            try
            {
                // Ensure parent directory exists
                var dir = Path.GetDirectoryName(fullPath);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

                await System.IO.File.WriteAllTextAsync(fullPath, request.Content, new UTF8Encoding(false));
                return Ok(ApiResponse<string>.SuccessResponse("Saved", "File saved successfully."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// POST /api/filesystem/create
        /// Creates a new file or directory.
        /// </summary>
        [HttpPost("create")]
        public ActionResult<ApiResponse<FileNodeDto>> CreateItem([FromBody] CreateItemRequest request)
        {
            var resolved = ResolveSafe(request.RelativePath);
            if (resolved.Result != null) return resolved.Result!;
            var fullPath = resolved.Value!;

            if (System.IO.File.Exists(fullPath) || Directory.Exists(fullPath))
                return Conflict(ApiResponse<FileNodeDto>.FailureResponse("Item already exists."));

            try
            {
                if (request.IsDirectory)
                {
                    Directory.CreateDirectory(fullPath);
                    return Ok(ApiResponse<FileNodeDto>.SuccessResponse(BuildNode(new DirectoryInfo(fullPath)), "Folder created."));
                }
                else
                {
                    var dir = Path.GetDirectoryName(fullPath);
                    if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
                    System.IO.File.WriteAllText(fullPath, "", new UTF8Encoding(false));
                    return Ok(ApiResponse<FileNodeDto>.SuccessResponse(BuildNode(new FileInfo(fullPath)), "File created."));
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<FileNodeDto>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// POST /api/filesystem/rename
        /// Renames a file or directory.
        /// </summary>
        [HttpPost("rename")]
        public ActionResult<ApiResponse<FileNodeDto>> RenameItem([FromBody] RenameItemRequest request)
        {
            var resolved = ResolveSafe(request.RelativePath);
            if (resolved.Result != null) return resolved.Result!;
            var fullPath = resolved.Value!;

            if (string.IsNullOrWhiteSpace(request.NewName) || request.NewName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
                return BadRequest(ApiResponse<FileNodeDto>.FailureResponse("Invalid file name."));

            var newPath = Path.Combine(Path.GetDirectoryName(fullPath)!, request.NewName);
            if (!newPath.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
                return BadRequest(ApiResponse<FileNodeDto>.FailureResponse("Invalid target path."));

            try
            {
                if (Directory.Exists(fullPath))
                {
                    Directory.Move(fullPath, newPath);
                    return Ok(ApiResponse<FileNodeDto>.SuccessResponse(BuildNode(new DirectoryInfo(newPath)), "Folder renamed."));
                }
                else if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Move(fullPath, newPath);
                    return Ok(ApiResponse<FileNodeDto>.SuccessResponse(BuildNode(new FileInfo(newPath)), "File renamed."));
                }
                return NotFound(ApiResponse<FileNodeDto>.FailureResponse("Item not found."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<FileNodeDto>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// DELETE /api/filesystem/delete?path=
        /// Deletes a file or directory (directories are deleted recursively).
        /// </summary>
        [HttpDelete("delete")]
        public ActionResult<ApiResponse<string>> DeleteItem([FromQuery] string path)
        {
            var resolved = ResolveSafe(path);
            if (resolved.Result != null) return resolved.Result!;
            var fullPath = resolved.Value!;

            // Prevent deleting the root itself
            if (string.Equals(fullPath, _rootPath, StringComparison.OrdinalIgnoreCase))
                return BadRequest(ApiResponse<string>.FailureResponse("Cannot delete the root directory."));

            try
            {
                if (Directory.Exists(fullPath))
                {
                    Directory.Delete(fullPath, recursive: true);
                    return Ok(ApiResponse<string>.SuccessResponse("Deleted", "Folder deleted."));
                }
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                    return Ok(ApiResponse<string>.SuccessResponse("Deleted", "File deleted."));
                }
                return NotFound(ApiResponse<string>.FailureResponse("Item not found."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.FailureResponse(ex.Message));
            }
        }

        /// <summary>
        /// GET /api/filesystem/root-info
        /// Returns the root path label shown in the file tree.
        /// </summary>
        [HttpGet("root-info")]
        public ActionResult<ApiResponse<object>> GetRootInfo()
        {
            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                rootLabel = "Frontend",
                rootPath  = ""
            }));
        }
    }
}
