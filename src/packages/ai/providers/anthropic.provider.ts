import { LLMProvider, LLMRequest, LLMResponse, StructuredLLMRequest, StructuredLLMResponse } from '../types';
import { ExternalApiError, logger } from '@/packages/config';

export class AnthropicProvider implements LLMProvider {
  public readonly name = 'anthropic';
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey || process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || '';
    this.defaultModel = process.env.LLM_MODEL || defaultModel;
  }

  private checkCredentials() {
    if (!this.apiKey) {
      throw new ExternalApiError(
        'Anthropic',
        'Anthropic API key missing. Please set LLM_API_KEY or ANTHROPIC_API_KEY in .env.'
      );
    }
  }

  async generateText(input: LLMRequest): Promise<LLMResponse> {
    this.checkCredentials();
    const startTime = Date.now();
    const model = input.model || this.defaultModel;

    const systemMessage = input.messages.find((m) => m.role === 'system')?.content || '';
    const nonSystemMessages = input.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: systemMessage,
        messages: nonSystemMessages,
        max_tokens: input.maxTokens ?? 2000,
        temperature: input.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new ExternalApiError('Anthropic', `HTTP ${response.status}: ${errText}`, response.status);
    }

    const json = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    const text = json.content[0]?.text || '';
    return {
      text,
      tokensUsed: {
        promptTokens: json.usage?.input_tokens || 0,
        completionTokens: json.usage?.output_tokens || 0,
        totalTokens: (json.usage?.input_tokens || 0) + (json.usage?.output_tokens || 0),
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

    const systemMessage = input.messages.find((m) => m.role === 'system')?.content || '';
    const structuredSystem = `${systemMessage}\n\nIMPORTANT: Return ONLY a valid, unescaped JSON object conforming to the requested schema. Do not enclose in markdown code fences or add conversational text.`;

    const nonSystemMessages = input.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: structuredSystem,
        messages: nonSystemMessages,
        max_tokens: input.maxTokens ?? 2500,
        temperature: input.temperature ?? 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new ExternalApiError('Anthropic', `HTTP ${response.status}: ${errText}`, response.status);
    }

    const json = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    let rawText = json.content[0]?.text || '{}';
    // Clean markdown code blocks if model included them
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText.trim());
    } catch {
      throw new ExternalApiError('Anthropic', `Failed to parse JSON response: ${rawText.slice(0, 100)}`);
    }

    const validated = input.schema.parse(parsed);

    return {
      data: validated,
      rawText,
      tokensUsed: {
        promptTokens: json.usage?.input_tokens || 0,
        completionTokens: json.usage?.output_tokens || 0,
        totalTokens: (json.usage?.input_tokens || 0) + (json.usage?.output_tokens || 0),
      },
      latencyMs: Date.now() - startTime,
      model,
      provider: this.name,
    };
  }
}
