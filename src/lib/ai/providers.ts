import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

export type AIProvider = "openai" | "anthropic" | "groq" | "openrouter";

export interface AIProviderConfig {
  provider: AIProvider;
  model?: string;
  apiKey?: string;
}

/**
 * Get an AI provider instance based on configuration
 */
export function getAIProvider(config: AIProviderConfig) {
  if (!config.apiKey) {
    throw new Error("API key is required. Please set your API key in Settings.");
  }

  switch (config.provider) {
    case "openai":
      return createOpenAI({ apiKey: config.apiKey })(config.model || "gpt-4o");

    case "anthropic":
      return createAnthropic({ apiKey: config.apiKey })(config.model || "claude-sonnet-4-20250514");

    case "groq":
      return createOpenAI({
        apiKey: config.apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      })(config.model || "llama-3.3-70b-versatile");

    case "openrouter":
      return createOpenAI({
        apiKey: config.apiKey,
        baseURL: "https://openrouter.ai/api/v1",
      })(config.model || "anthropic/claude-3.5-sonnet");

    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

/**
 * Get the default AI provider from environment or user preferences
 */
export function getDefaultProvider(
  userProvider?: string | null,
  userModel?: string | null
): AIProviderConfig {
  const provider = (userProvider as AIProvider) || "openai";
  const model = userModel || undefined;

  return { provider, model };
}

/**
 * Available models per provider
 */
export const AVAILABLE_MODELS: Record<AIProvider, { id: string; name: string; description: string }[]> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o", description: "Best for complex code generation and analysis" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and cost-effective for simpler tasks" },
    { id: "o3-mini", name: "o3-mini", description: "Reasoning model for complex problems" },
  ],
  anthropic: [
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", description: "Balanced performance and speed" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", description: "Fast and efficient" },
  ],
  groq: [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", description: "Fast inference, great for code analysis" },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", description: "Ultra-fast for simpler tasks" },
  ],
  openrouter: [
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", description: "Via OpenRouter aggregator" },
    { id: "openai/gpt-4o", name: "GPT-4o", description: "Via OpenRouter aggregator" },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", description: "Via OpenRouter aggregator" },
  ],
};
