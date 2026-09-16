import { LLMProvider, LLMRequest, LLMResponse, StructuredLLMRequest, StructuredLLMResponse } from '../types';
import { ExternalApiError, logger } from '@/packages/config';

export class OpenAIProvider implements LLMProvider {
  public readonly name = 'openai';
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel = 'gpt-4o-mini') {
    this.apiKey = apiKey || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '';
    this.defaultModel = process.env.LLM_MODEL || defaultModel;
  }

  private checkCredentials() {
    if (!this.apiKey) {
      throw new ExternalApiError(
        'OpenAI',
        'OpenAI API key missing. Please set LLM_API_KEY or OPENAI_API_KEY in .env.'
      );
    }
  }

  async generateText(input: LLMRequest): Promise<LLMResponse> {
    this.checkCredentials();
    const startTime = Date.now();
    const model = input.model || this.defaultModel;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: input.messages,
        temperature: input.temperature ?? 0.7,
        max_tokens: input.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new ExternalApiError('OpenAI', `HTTP ${response.status}: ${errText}`, response.status);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return {
      text: json.choices[0]?.message?.content || '',
      tokensUsed: {
        promptTokens: json.usage?.prompt_tokens || 0,
        completionTokens: json.usage?.completion_tokens || 0,
        totalTokens: json.usage?.total_tokens || 0,
      },
      latencyMs: Date.now() - startTime,
      model,
      provider: this.name,
    };
  }

  async generateStructured<T>(input: StructuredLLMRequest<T>): Promise<StructuredLLMResponse<T>> {
    this.checkCredentials();
    const startTime = Date.now();
    const model = input.model || this.defaultModel;

    const systemPrompt = input.messages.find((m) => m.role === 'system')?.content || '';
    const augmentedSystem = `${systemPrompt}\n\nIMPORTANT: You must return valid JSON strictly conforming to the requested schema. Return only the JSON object without code blocks or extra text.`;

    const messages = input.messages.map((m) => (m.role === 'system' ? { ...m, content: augmentedSystem } : m));
    if (!messages.some((m) => m.role === 'system')) {
      messages.unshift({ role: 'system', content: augmentedSystem });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' },
        temperature: input.temperature ?? 0.3,
        max_tokens: input.maxTokens ?? 2500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new ExternalApiError('OpenAI', `HTTP ${response.status}: ${errText}`, response.status);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const rawText = json.choices[0]?.message?.content || '{}';
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new ExternalApiError('OpenAI', 'Failed to parse JSON response from OpenAI API');
    }

    const validated = input.schema.parse(parsed);

    return {
      data: validated,
      rawText,
      tokensUsed: {
        promptTokens: json.usage?.prompt_tokens || 0,
        completionTokens: json.usage?.completion_tokens || 0,
        totalTokens: json.usage?.total_tokens || 0,
      },
      latencyMs: Date.now() - startTime,
      model,
      provider: this.name,
    };
  }
}
