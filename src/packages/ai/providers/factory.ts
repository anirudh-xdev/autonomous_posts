import { LLMProvider } from '../types';
import { MockLLMProvider } from './mock.provider';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GoogleGeminiProvider } from './gemini.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { env, logger } from '@/packages/config';

export class LLMProviderFactory {
  private static instance: LLMProvider | null = null;

  public static getProvider(providerType?: string): LLMProvider {
    if (process.env.NODE_ENV === 'test' && !providerType) {
      return new MockLLMProvider();
    }

    const selected = providerType || env.LLM_PROVIDER;

    switch (selected) {
      case 'openrouter':
        if (!process.env.LLM_API_KEY && !process.env.OPENROUTER_API_KEY) {
          logger.warn('OpenRouter selected but no API key found. Falling back to MockLLMProvider for safe execution.');
          return new MockLLMProvider();
        }
        return new OpenRouterProvider();

      case 'openai':
        if (!process.env.LLM_API_KEY && !process.env.OPENAI_API_KEY) {
          logger.warn('OpenAI selected but no API key found. Falling back to MockLLMProvider for safe execution.');
          return new MockLLMProvider();
        }
        return new OpenAIProvider();

      case 'anthropic':
        if (!process.env.LLM_API_KEY && !process.env.ANTHROPIC_API_KEY) {
          logger.warn('Anthropic selected but no API key found. Falling back to MockLLMProvider for safe execution.');
          return new MockLLMProvider();
        }
        return new AnthropicProvider();

      case 'gemini':
        if (!process.env.LLM_API_KEY && !process.env.GEMINI_API_KEY) {
          logger.warn('Gemini selected but no API key found. Falling back to MockLLMProvider for safe execution.');
          return new MockLLMProvider();
        }
        return new GoogleGeminiProvider();

      case 'mock':
      default:
        return new MockLLMProvider();
    }
  }

  public static getDefault(): LLMProvider {
    if (!this.instance) {
      this.instance = this.getProvider();
    }
    return this.instance;
  }

  // Reset instance for testing
  public static reset() {
    this.instance = null;
  }
}
