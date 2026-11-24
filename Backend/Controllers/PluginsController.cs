using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Backend.Models; // For ApiResponse

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PluginsController : ControllerBase
    {
        private static readonly string _docsPluginsPath = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "docs", "plugins")
        );
        private static readonly string _frontendComponentsPath = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Frontend", "admin", "components")
        );

        public record PluginDto(string Id, string Name, string Version, string Description, bool IsInstalled, string? Icon);

        [HttpGet("available")]
        public ActionResult<ApiResponse<IEnumerable<PluginDto>>> GetAvailablePlugins()
        {
            var plugins = new List<PluginDto>();
            if (Directory.Exists(_docsPluginsPath))
            {
                foreach (var dir in Directory.GetDirectories(_docsPluginsPath))
                {
                    var jsonPath = Path.Combine(dir, "plugin.json");
                    if (System.IO.File.Exists(jsonPath))
                    {
                        var json = System.IO.File.ReadAllText(jsonPath);
                        try
                        {
                            var element = JsonSerializer.Deserialize<JsonElement>(json);
                            var id = element.GetProperty("id").GetString();
                            var name = element.GetProperty("name").GetString();
                            var version = element.GetProperty("version").GetString();
                            var description = element.GetProperty("description").GetString();
                            string? icon = null;
                            if (element.TryGetProperty("icon", out var iconProp))
                            {
                                icon = iconProp.GetString();
                            }
                            
                            var isInstalled = false;
                            if (element.TryGetProperty("files", out var files))
                            {
                                // A plugin is considered installed if all its files exist in the admin/components folder
                                isInstalled = true;
                                foreach (var file in files.EnumerateArray())
                                {
                                    if (!System.IO.File.Exists(Path.Combine(_frontendComponentsPath, file.GetString())))
                                    {
                                        isInstalled = false;
                                        break;
                                    }
                                }
                            }

                            plugins.Add(new PluginDto(id, name, version, description, isInstalled, icon));
                        }
                        catch { /* Ignore invalid json */ }
                    }
                }
            }
            return Ok(ApiResponse<IEnumerable<PluginDto>>.SuccessResponse(plugins));
        }
        
        private string? GetPluginDirectoryById(string id)
        {
            if (!Directory.Exists(_docsPluginsPath)) return null;
            
            foreach (var dir in Directory.GetDirectories(_docsPluginsPath))
            {
                var jsonPath = Path.Combine(dir, "plugin.json");
                if (System.IO.File.Exists(jsonPath))
                {
                    try
                    {
                        var json = System.IO.File.ReadAllText(jsonPath);
                        var element = JsonSerializer.Deserialize<JsonElement>(json);
                        var pluginId = element.GetProperty("id").GetString();
                        if (pluginId == id)
                        {
                            return dir;
                        }
                    }
                    catch { /* Ignore invalid json */ }
                }
            }
            return null;
        }

        [HttpPost("install/{id}")]
        public ActionResult<ApiResponse<string>> InstallPlugin(string id)
        {
            var pluginDir = GetPluginDirectoryById(id);
            if (pluginDir == null)
                return NotFound(ApiResponse<string>.FailureResponse("Plugin not found in repository."));
                
            var jsonPath = Path.Combine(pluginDir, "plugin.json");
            var json = System.IO.File.ReadAllText(jsonPath);
            try
            {
                var element = JsonSerializer.Deserialize<JsonElement>(json);
                if (element.TryGetProperty("files", out var files))
                {
                    foreach (var file in files.EnumerateArray())
                    {
                        var fileName = file.GetString();
                        var sourcePath = Path.Combine(pluginDir, fileName);
                        var destPath = Path.Combine(_frontendComponentsPath, fileName);
                        
                        if (System.IO.File.Exists(sourcePath))
                        {
                            System.IO.File.Copy(sourcePath, destPath, overwrite: true);
                        }
                    }
                }
                return Ok(ApiResponse<string>.SuccessResponse("Installed", "Plugin installed successfully."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.FailureResponse(ex.Message));
            }
        }
        
        [HttpDelete("{id}")]
        public ActionResult<ApiResponse<string>> DeletePlugin(string id)
        {
            var pluginDir = GetPluginDirectoryById(id);
            if (pluginDir == null)
            {
                 return NotFound(ApiResponse<string>.FailureResponse("Plugin not found in repository to determine files."));
            }
            
            var jsonPath = Path.Combine(pluginDir, "plugin.json");
            var json = System.IO.File.ReadAllText(jsonPath);
            try
            {
                var element = JsonSerializer.Deserialize<JsonElement>(json);
                if (element.TryGetProperty("files", out var files))
                {
                    foreach (var file in files.EnumerateArray())
                    {
                        var fileName = file.GetString();
                        var destPath = Path.Combine(_frontendComponentsPath, fileName);
                        
                        if (System.IO.File.Exists(destPath))
                        {
                            System.IO.File.Delete(destPath);
                        }
                    }
                }
                return Ok(ApiResponse<string>.SuccessResponse("Deleted", "Plugin completely deleted from project."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.FailureResponse(ex.Message));
            }
        }
    }
}
