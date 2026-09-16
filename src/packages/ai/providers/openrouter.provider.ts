import { LLMProvider, LLMRequest, LLMResponse, StructuredLLMRequest, StructuredLLMResponse } from '../types';
import { ExternalApiError, logger, env } from '@/packages/config';

export class OpenRouterProvider implements LLMProvider {
  public readonly name = 'openrouter';
  private apiKey: string;
  // Default to fast, high-precision free model on OpenRouter: Cohere North Mini Code
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel = 'cohere/north-mini-code:free') {
    this.apiKey =
      apiKey ||
      process.env.OPENROUTER_API_KEY ||
      process.env.LLM_API_KEY ||
      '';
    this.defaultModel =
      process.env.OPENROUTER_MODEL ||
      process.env.LLM_MODEL ||
      defaultModel;
  }

  private checkCredentials() {
    if (!this.apiKey) {
      throw new ExternalApiError(
        'OpenRouter',
        'OpenRouter API key missing. Please set OPENROUTER_API_KEY or LLM_API_KEY in .env.'
      );
    }
  }

  private cleanJson(raw: string): string {
    const trimmed = raw.trim();

    // 1. If it's already valid JSON, don't alter it!
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      // Continue with extraction
    }

    let clean = trimmed;

    // 2. If the ENTIRE output is wrapped in ```json ... ``` code fence
    const outerFenceMatch = clean.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (outerFenceMatch && outerFenceMatch[1]) {
      clean = outerFenceMatch[1].trim();
      try {
        JSON.parse(clean);
        return clean;
      } catch {
        // Continue
      }
    }

    // 3. Extract balanced JSON object between outermost braces
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1).trim();
    }

    return clean;
  }

  async generateText(input: LLMRequest): Promise<LLMResponse> {
    this.checkCredentials();
    const startTime = Date.now();
    const model = input.model || this.defaultModel;

    logger.info('OpenRouterProvider: sending chat completion request', { model });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 75000);

    let response: Response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': env.APP_URL || 'http://localhost:3000',
          'X-Title': 'AI Trend Content Automation Agent',
        },
        body: JSON.stringify({
          model,
          messages: input.messages,
          temperature: input.temperature ?? 0.7,
          max_tokens: input.maxTokens ?? 2000,
        }),
      });
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        throw new ExternalApiError('OpenRouter', 'OpenRouter request timed out after 75s. Please retry.');
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errText = await response.text();
      logger.error('OpenRouter text generation failed', { status: response.status, body: errText });
      throw new ExternalApiError('OpenRouter', `HTTP ${response.status}: ${errText}`, response.status);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
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

    logger.info('OpenRouterProvider: sending structured completion request', { model });

    const systemPrompt = input.messages.find((m) => m.role === 'system')?.content || '';
    const augmentedSystem = `${systemPrompt}\n\nCRITICAL FORMAT REQUIREMENT:\nYou must return strictly valid, raw JSON conforming directly to the requested schema. Return the JSON object directly at the root level without wrapping it in an outer key (e.g., return {"keyFacts": ...}, NOT {"report": {"keyFacts": ...}}). Do NOT include markdown code blocks, backticks, or any conversational prose outside the JSON object.`;

    const messages = input.messages.map((m) =>
      m.role === 'system' ? { ...m, content: augmentedSystem } : m
    );
    if (!messages.some((m) => m.role === 'system')) {
      messages.unshift({ role: 'system', content: augmentedSystem });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 75000);

    let response: Response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': env.APP_URL || 'http://localhost:3000',
          'X-Title': 'AI Trend Content Automation Agent',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: input.temperature ?? 0.3,
          max_tokens: input.maxTokens ?? 4096,
        }),
      });
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        throw new ExternalApiError('OpenRouter', 'OpenRouter request timed out after 75s. Please retry.');
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errText = await response.text();
      logger.error('OpenRouter structured generation failed', { status: response.status, body: errText });
      throw new ExternalApiError('OpenRouter', `HTTP ${response.status}: ${errText}`, response.status);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const rawContent = json.choices[0]?.message?.content || '{}';
    const cleaned = this.cleanJson(rawContent);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('\n--- RAW CONTENT FROM OPENROUTER ---');
      console.error(rawContent);
      console.error('--- END RAW CONTENT ---\n');
      console.error('--- CLEANED ---');
      console.error(cleaned);
      console.error('--- END CLEANED ---\n');
      logger.error('Failed to parse JSON from OpenRouter', { rawContent, cleaned });
      throw new ExternalApiError('OpenRouter', `Invalid JSON response from OpenRouter: ${String(parseErr)}`);
    }

    // 1. Direct validation
    const directResult = input.schema.safeParse(parsed);
    if (directResult.success) {
      return {
        data: directResult.data,
        rawText: rawContent,
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

    // 2. Resilient unwrapping if LLM wrapped object in a container key (e.g. { report: {...} })
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val && typeof val === 'object') {
          const nestedResult = input.schema.safeParse(val);
          if (nestedResult.success) {
            logger.info(`OpenRouterProvider: unwrapped structured response from container key '${key}'`);
            return {
              data: nestedResult.data,
              rawText: rawContent,
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
      }
    }

    // 3. Fallback to schema.parse to log and throw exact Zod validation error
    console.error('Validation failed for parsed JSON:', JSON.stringify(parsed, null, 2));
    const validated = input.schema.parse(parsed);

    return {
      data: validated,
      rawText: rawContent,
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
