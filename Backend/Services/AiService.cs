using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Backend.Configurations;
using Backend.Interfaces;

namespace Backend.Services
{
    public class AiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly AiSettings _settings;
        private readonly ILogger<AiService> _logger;

        public AiService(HttpClient httpClient, IOptions<AiSettings> settings, ILogger<AiService> logger)
        {
            _httpClient = httpClient;
            _settings = settings.Value ?? new AiSettings();
            _logger = logger;
            _httpClient.Timeout = TimeSpan.FromSeconds(25);
        }

        public string GetActiveProviderName() => _settings.Provider;

        public async Task<List<AiProviderInfo>> GetAvailableProvidersAsync()
        {
            var list = new List<AiProviderInfo>();

            // 1. Ollama Local Health Check
            bool ollamaAvailable = false;
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(1500));
                var res = await _httpClient.GetAsync($"{_settings.OllamaEndpoint}/api/tags", cts.Token);
                ollamaAvailable = res.IsSuccessStatusCode;
            }
            catch { /* offline */ }

            list.Add(new AiProviderInfo(
                "Ollama (Local Desktop)",
                "100% Free & Unlimited on your desktop. Zero rate limits, runs offline, complete privacy.",
                ollamaAvailable,
                true,
                _settings.OllamaEndpoint,
                _settings.OllamaModel
            ));

            // 2. OpenRouter (Free Models)
            list.Add(new AiProviderInfo(
                "OpenRouter (:free models)",
                "Free cloud access to DeepSeek-R1, Llama 3.3, and Qwen 2.5 Coder without subscription.",
                !string.IsNullOrEmpty(_settings.OpenRouterApiKey),
                true,
                "https://openrouter.ai/api/v1/chat/completions",
                _settings.OpenRouterModel
            ));

            // 3. Google Gemini (Free Tier)
            list.Add(new AiProviderInfo(
                "Google Gemini Free Tier",
                "Google AI Studio free tier: 15 RPM, 1 million TPM, 1,500 daily requests with Gemini 1.5/2.0 Flash.",
                !string.IsNullOrEmpty(_settings.GeminiApiKey),
                true,
                "https://generativelanguage.googleapis.com",
                _settings.GeminiModel
            ));

            // 4. Groq Cloud (Free Tier)
            list.Add(new AiProviderInfo(
                "Groq Cloud Free Tier",
                "Ultra-fast 500+ tokens/sec inference on Llama 3.3 70B with generous free tier.",
                !string.IsNullOrEmpty(_settings.GroqApiKey),
                true,
                "https://api.groq.com/openai/v1/chat/completions",
                _settings.GroqModel
            ));

            // 5. Local Autonomous Engine
            list.Add(new AiProviderInfo(
                "Built-in Autonomous Engine",
                "Always available, zero dependencies. Directly modifies projects, skills, services, and duplicates site.",
                true,
                true,
                "Internal",
                "Portfolio-Architect-v1"
            ));

            return list;
        }

        public async Task<AiCompletionResult> GenerateChatCompletionAsync(string userMessage, string systemPrompt, List<ChatMessage>? history = null)
        {
            var provider = _settings.Provider?.Trim();

            // ── Auto-Detection Strategy ─────────────────────────────────────────
            // 1. If provider is "Auto" or "Ollama", check if Ollama is running on localhost
            if (string.Equals(provider, "Auto", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(provider, "Ollama", StringComparison.OrdinalIgnoreCase))
            {
                var ollamaRes = await TryOllamaAsync(userMessage, systemPrompt, history);
                if (ollamaRes != null) return ollamaRes;
            }

            // 2. Try OpenRouter if configured
            if ((string.Equals(provider, "Auto", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(provider, "OpenRouter", StringComparison.OrdinalIgnoreCase)) &&
                !string.IsNullOrWhiteSpace(_settings.OpenRouterApiKey))
            {
                var openRouterRes = await TryOpenRouterAsync(userMessage, systemPrompt, history);
                if (openRouterRes != null) return openRouterRes;
            }

            // 3. Try Gemini if configured
            if ((string.Equals(provider, "Auto", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(provider, "Gemini", StringComparison.OrdinalIgnoreCase)) &&
                !string.IsNullOrWhiteSpace(_settings.GeminiApiKey))
            {
                var geminiRes = await TryGeminiAsync(userMessage, systemPrompt, history);
                if (geminiRes != null) return geminiRes;
            }

            // 4. Try Groq if configured
            if ((string.Equals(provider, "Auto", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(provider, "Groq", StringComparison.OrdinalIgnoreCase)) &&
                !string.IsNullOrWhiteSpace(_settings.GroqApiKey))
            {
                var groqRes = await TryGroqAsync(userMessage, systemPrompt, history);
                if (groqRes != null) return groqRes;
            }

            // 5. Default Fallback: Local Autonomous Engine
            return new AiCompletionResult(
                string.Empty, // Signals controller to use its high-speed rule & database executor
                "LocalEngine",
                "Portfolio-Architect-v1",
                true
            );
        }

        private List<object> BuildOpenAiMessages(string systemPrompt, string userMessage, List<ChatMessage>? history)
        {
            var messages = new List<object>
            {
                new { role = "system", content = systemPrompt }
            };

            if (history != null && history.Count > 0)
            {
                foreach (var msg in history.TakeLast(8))
                {
                    var role = string.Equals(msg.Role, "user", StringComparison.OrdinalIgnoreCase) ? "user" : "assistant";
                    messages.Add(new { role, content = msg.Content });
                }
            }

            messages.Add(new { role = "user", content = userMessage });
            return messages;
        }

        private async Task<AiCompletionResult?> TryOllamaAsync(string userMessage, string systemPrompt, List<ChatMessage>? history)
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(20));
                var payload = new
                {
                    model = _settings.OllamaModel,
                    messages = BuildOpenAiMessages(systemPrompt, userMessage, history),
                    stream = false
                };

                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var res = await _httpClient.PostAsync($"{_settings.OllamaEndpoint}/v1/chat/completions", content, cts.Token);

                if (res.IsSuccessStatusCode)
                {
                    var json = await res.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    var text = doc.RootElement
                        .GetProperty("choices")[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString();

                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        return new AiCompletionResult(text.Trim(), "Ollama", _settings.OllamaModel, false);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug("Ollama not reachable: {Message}", ex.Message);
            }
            return null;
        }

        private async Task<AiCompletionResult?> TryOpenRouterAsync(string userMessage, string systemPrompt, List<ChatMessage>? history)
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(20));
                using var req = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions");
                req.Headers.Add("Authorization", $"Bearer {_settings.OpenRouterApiKey}");
                req.Headers.Add("HTTP-Referer", "http://localhost:5100");
                req.Headers.Add("X-Title", "Portfolio CMS AI Architect");

                var payload = new
                {
                    model = _settings.OpenRouterModel,
                    messages = BuildOpenAiMessages(systemPrompt, userMessage, history)
                };

                req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var res = await _httpClient.SendAsync(req, cts.Token);

                if (res.IsSuccessStatusCode)
                {
                    var json = await res.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    var text = doc.RootElement
                        .GetProperty("choices")[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString();

                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        return new AiCompletionResult(text.Trim(), "OpenRouter", _settings.OpenRouterModel, false);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("OpenRouter request failed: {Message}", ex.Message);
            }
            return null;
        }

        private async Task<AiCompletionResult?> TryGeminiAsync(string userMessage, string systemPrompt, List<ChatMessage>? history)
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(20));
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_settings.GeminiModel}:generateContent?key={_settings.GeminiApiKey}";

                var sb = new StringBuilder();
                sb.AppendLine(systemPrompt);
                if (history != null && history.Count > 0)
                {
                    sb.AppendLine("\n--- Recent Conversation ---");
                    foreach (var msg in history.TakeLast(6))
                    {
                        sb.AppendLine($"{msg.Role}: {msg.Content}");
                    }
                }
                sb.AppendLine($"\nUser prompt: {userMessage}");

                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            role = "user",
                            parts = new[]
                            {
                                new { text = sb.ToString() }
                            }
                        }
                    }
                };

                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var res = await _httpClient.PostAsync(url, content, cts.Token);

                if (res.IsSuccessStatusCode)
                {
                    var json = await res.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    var text = doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();

                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        return new AiCompletionResult(text.Trim(), "Google Gemini", _settings.GeminiModel, false);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Gemini request failed: {Message}", ex.Message);
            }
            return null;
        }

        private async Task<AiCompletionResult?> TryGroqAsync(string userMessage, string systemPrompt, List<ChatMessage>? history)
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(20));
                using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
                req.Headers.Add("Authorization", $"Bearer {_settings.GroqApiKey}");

                var payload = new
                {
                    model = _settings.GroqModel,
                    messages = BuildOpenAiMessages(systemPrompt, userMessage, history)
                };

                req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var res = await _httpClient.SendAsync(req, cts.Token);

                if (res.IsSuccessStatusCode)
                {
                    var json = await res.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    var text = doc.RootElement
                        .GetProperty("choices")[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString();

                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        return new AiCompletionResult(text.Trim(), "Groq", _settings.GroqModel, false);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Groq request failed: {Message}", ex.Message);
            }
            return null;
        }
    }
}
