namespace Backend.Configurations
{
    public class AiSettings
    {
        /// <summary>
        /// Selected Provider: "Auto", "Ollama", "OpenRouter", "Gemini", "Groq", or "LocalEngine"
        /// "Auto" will check Ollama first (100% free unlimited local), then API keys, then LocalEngine.
        /// </summary>
        public string Provider { get; set; } = "Auto";

        // 1. Ollama (100% Free & Unlimited on Localhost)
        public string OllamaEndpoint { get; set; } = "http://localhost:11434";
        public string OllamaModel { get; set; } = "llama3.2";

        // 2. OpenRouter (Free models: deepseek/deepseek-r1:free, meta-llama/llama-3.2-3b-instruct:free)
        public string OpenRouterApiKey { get; set; } = "";
        public string OpenRouterModel { get; set; } = "meta-llama/llama-3.2-3b-instruct:free";

        // 3. Google Gemini Free Tier
        public string GeminiApiKey { get; set; } = "";
        public string GeminiModel { get; set; } = "gemini-1.5-flash";

        // 4. Groq Free Tier
        public string GroqApiKey { get; set; } = "";
        public string GroqModel { get; set; } = "llama-3.3-70b-versatile";
    }
}
