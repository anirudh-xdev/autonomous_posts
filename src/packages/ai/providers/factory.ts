import { LLMProvider } from '../types';
import { MockLLMProvider } from './mock.provider';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GoogleGeminiProvider } from './gemini.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { HuggingFaceProvider } from './huggingface.provider';
import { env, logger } from '@/packages/config';

export class LLMProviderFactory {
  private static instance: LLMProvider | null = null;

  public static getProvider(providerType?: string): LLMProvider {
    if (process.env.NODE_ENV === 'test' && !providerType) {
      return new MockLLMProvider();
    }

    const selected = providerType || env.LLM_PROVIDER;

    switch (selected) {
      case 'huggingface':
        if (!process.env.HUGGINGFACE_API_KEY && !process.env.HF_TOKEN && !process.env.LLM_API_KEY) {
          if (process.env.NODE_ENV === 'test') return new MockLLMProvider();
          throw new Error('Hugging Face selected but no API key found. Please provide HUGGINGFACE_API_KEY or HF_TOKEN in your .env file.');
        }
        return new HuggingFaceProvider();

      case 'openrouter':
        if (!process.env.LLM_API_KEY && !process.env.OPENROUTER_API_KEY) {
          if (process.env.NODE_ENV === 'test') return new MockLLMProvider();
          throw new Error('OpenRouter selected but no API key found. Please provide OPENROUTER_API_KEY or LLM_API_KEY in your .env file.');
        }
        return new OpenRouterProvider();

      case 'openai':
        if (!process.env.LLM_API_KEY && !process.env.OPENAI_API_KEY) {
          if (process.env.NODE_ENV === 'test') return new MockLLMProvider();
          throw new Error('OpenAI selected but no API key found. Please provide OPENAI_API_KEY or LLM_API_KEY in your .env file.');
        }
        return new OpenAIProvider();

      case 'anthropic':
        if (!process.env.LLM_API_KEY && !process.env.ANTHROPIC_API_KEY) {
          if (process.env.NODE_ENV === 'test') return new MockLLMProvider();
          throw new Error('Anthropic selected but no API key found. Please provide ANTHROPIC_API_KEY or LLM_API_KEY in your .env file.');
        }
        return new AnthropicProvider();

      case 'gemini':
        if (!process.env.LLM_API_KEY && !process.env.GEMINI_API_KEY) {
          if (process.env.NODE_ENV === 'test') return new MockLLMProvider();
          throw new Error('Gemini selected but no API key found. Please provide GEMINI_API_KEY or LLM_API_KEY in your .env file.');
        }
        return new GoogleGeminiProvider();

      case 'mock':
        if (process.env.NODE_ENV !== 'test') {
          logger.warn('Mock LLM provider explicitly requested in non-test environment.');
        }
        return new MockLLMProvider();

      default:
        if (process.env.NODE_ENV === 'test') {
          return new MockLLMProvider();
        }
        throw new Error(`Unknown or unconfigured LLM provider: ${selected}. Please set LLM_PROVIDER in .env to a valid provider (openrouter, openai, anthropic, gemini).`);
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
