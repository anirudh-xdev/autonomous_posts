import { LLMProvider, LLMRequest, LLMResponse, StructuredLLMRequest, StructuredLLMResponse } from '../types';
import { ExternalApiError } from '@/packages/config';

export class GoogleGeminiProvider implements LLMProvider {
  public readonly name = 'gemini';
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel = 'gemini-1.5-flash') {
    this.apiKey = apiKey || process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || '';
    this.defaultModel = process.env.LLM_MODEL || defaultModel;
  }

  private checkCredentials() {
    if (!this.apiKey) {
      throw new ExternalApiError(
        'Gemini',
        'Google Gemini API key missing. Please set LLM_API_KEY or GEMINI_API_KEY in .env.'
      );
    }
  }

  async generateText(input: LLMRequest): Promise<LLMResponse> {
    this.checkCredentials();
    const startTime = Date.now();
    const model = input.model || this.defaultModel;

    const contents = input.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: input.temperature ?? 0.7,
          maxOutputTokens: input.maxTokens ?? 2000,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new ExternalApiError('Gemini', `HTTP ${response.status}: ${err}`, response.status);
    }

    const json = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
    };

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      text,
      tokensUsed: {
        promptTokens: json.usageMetadata?.promptTokenCount || 0,
        completionTokens: json.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: json.usageMetadata?.totalTokenCount || 0,
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
    const augmentedUserMessage = `SYSTEM DIRECTIVE: ${systemPrompt}\n\nINSTRUCTION: Output STRICTLY valid JSON conforming to schema ${input.schemaName}.\n\nUSER PROMPT:\n${
      input.messages.find((m) => m.role === 'user')?.content || ''
    }`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: augmentedUserMessage }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: input.temperature ?? 0.2,
          maxOutputTokens: input.maxTokens ?? 2500,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new ExternalApiError('Gemini', `HTTP ${response.status}: ${err}`, response.status);
    }

    const json = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
    };

    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new ExternalApiError('Gemini', `Failed to parse JSON response: ${rawText.slice(0, 100)}`);
    }

    const validated = input.schema.parse(parsed);

    return {
      data: validated,
      rawText,
      tokensUsed: {
        promptTokens: json.usageMetadata?.promptTokenCount || 0,
        completionTokens: json.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: json.usageMetadata?.totalTokenCount || 0,
      },
      latencyMs: Date.now() - startTime,
      model,
      provider: this.name,
    };
  }
}
