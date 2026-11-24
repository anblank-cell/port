using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend.Interfaces
{
    public record AiCompletionResult(
        string Text,
        string ProviderUsed,
        string ModelUsed,
        bool IsFallback
    );

    public record AiProviderInfo(
        string Name,
        string Description,
        bool IsAvailable,
        bool IsFreeUnlimited,
        string Endpoint,
        string Model
    );

    public interface IAiService
    {
        Task<AiCompletionResult> GenerateChatCompletionAsync(string userMessage, string systemPrompt);
        Task<List<AiProviderInfo>> GetAvailableProvidersAsync();
        string GetActiveProviderName();
    }
}
