import { LLMProvider, LLMRequest, LLMResponse, StructuredLLMRequest, StructuredLLMResponse } from '../types';
import { ExternalApiError, logger } from '@/packages/config';

export class HuggingFaceProvider implements LLMProvider {
  public readonly name = 'huggingface';
  private apiKey: string;
  private defaultModel: string;
  private baseUrl = 'https://router.huggingface.co/v1';

  constructor(apiKey?: string, defaultModel = 'Qwen/Qwen2.5-72B-Instruct') {
    this.apiKey =
      apiKey ||
      process.env.HUGGINGFACE_API_KEY ||
      process.env.HF_TOKEN ||
      process.env.LLM_API_KEY ||
      '';
    this.defaultModel = process.env.HF_MODEL || process.env.LLM_MODEL || defaultModel;
  }

  private checkCredentials() {
    if (!this.apiKey) {
      throw new ExternalApiError(
        'HuggingFace',
        'Hugging Face API key missing. Please set HUGGINGFACE_API_KEY or HF_TOKEN in your .env file.'
      );
    }
  }

  /**
   * Cleans raw JSON from Hugging Face models by stripping code fences and repairing unescaped quotes.
   */
  private cleanJson(raw: string): string {
    const trimmed = raw.trim();
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      // Continue with extraction
    }

    let clean = trimmed;
    // Strip markdown code fences
    const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch && fenceMatch[1]) {
      clean = fenceMatch[1].trim();
      try {
        JSON.parse(clean);
        return clean;
      } catch {
        // Continue to brace extraction
      }
    }

    // Extract between first '{' and last '}'
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = clean.substring(firstBrace, lastBrace + 1).trim();
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // Continue to sanitize inner unescaped quotes
        clean = candidate;
      }
    }

    // Sanitize unescaped quotes inside strings
    try {
      const fixedQuotes = clean.replace(/(?<=[a-zA-Z0-9.,!?;:\s])"(?=[a-zA-Z0-9.,!?;:\s])/g, "'");
      JSON.parse(fixedQuotes);
      return fixedQuotes;
    } catch {
      return clean;
    }
  }

  /**
   * Helper to execute fetch with retry for model cold start (HTTP 503)
   */
  private async fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let res: Response;
      try {
        res = await fetch(url, options);
      } catch (fetchErr: any) {
        if (attempt < maxRetries) {
          logger.warn(`Fetch to Hugging Face failed (attempt ${attempt + 1}/${maxRetries}), retrying in 2s...`, fetchErr);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        const cause = fetchErr.cause ? ` (${fetchErr.cause.message || fetchErr.cause.code || String(fetchErr.cause)})` : '';
        throw new ExternalApiError('HuggingFace', `Network connection to Hugging Face failed: ${fetchErr.message}${cause}`);
      }

      // HTTP 503 usually indicates model is currently loading on Hugging Face Serverless
      if (res.status === 503 && attempt < maxRetries) {
        let waitTime = 8000;
        try {
          const body = await res.clone().json();
          if (body.estimated_time && typeof body.estimated_time === 'number') {
            waitTime = Math.min(Math.round(body.estimated_time * 1000), 20000);
          }
        } catch {}
        logger.info(`Hugging Face model is warming up. Waiting ${waitTime / 1000}s before retry (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      return res;
    }
    return fetch(url, options);
  }

  async generateText(input: LLMRequest): Promise<LLMResponse> {
    this.checkCredentials();
    const startTime = Date.now();
    const model = input.model || this.defaultModel;

    logger.info('HuggingFaceProvider: sending chat completion request', { model });

    const messages = input.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let response: Response;
    try {
      response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: input.temperature ?? 0.7,
          max_tokens: input.maxTokens ?? 2048,
        }),
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new ExternalApiError('HuggingFace', 'Hugging Face request timed out after 90s.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errText = await response.text();
      logger.error('Hugging Face text generation failed', { status: response.status, body: errText });
      let message = `HTTP ${response.status}: ${errText}`;
      if (response.status === 403) {
        message = 'Hugging Face Permission Error (HTTP 403): Your HF_TOKEN lacks "Inference Providers" permission. Go to https://huggingface.co/settings/tokens, edit your token (or create a new Fine-grained Token), and check the box: "Make calls to Inference Providers" (or create a classic "Write" token).';
      } else if (response.status === 429) {
        message = 'Hugging Face rate limit reached. Please wait or check your HF_TOKEN usage.';
      }
      throw new ExternalApiError('HuggingFace', message, response.status);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    let text = json.choices?.[0]?.message?.content || '';
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    return {
      text,
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

    logger.info('HuggingFaceProvider: sending structured completion request', { model, schema: input.schemaName });

    const augmentedSystem = `You are a precision AI system. You MUST output STRICTLY valid, raw JSON conforming to schema '${input.schemaName}'.
DO NOT wrap the response in markdown code blocks (\`\`\`json).
DO NOT include explanations, preamble, conversational text, or reasoning.
Output ONLY the JSON object.`;

    const messages = input.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    if (!messages.some((m) => m.role === 'system')) {
      messages.unshift({ role: 'system', content: augmentedSystem });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let response: Response;
    try {
      response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: input.temperature ?? 0.2,
          max_tokens: input.maxTokens ?? 3000,
          response_format: { type: 'json_object' },
        }),
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new ExternalApiError('HuggingFace', 'Hugging Face structured generation timed out after 90s.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errText = await response.text();
      logger.error('Hugging Face structured generation failed', { status: response.status, body: errText });
      let message = `HTTP ${response.status}: ${errText}`;
      if (response.status === 403) {
        message = 'Hugging Face Permission Error (HTTP 403): Your HF_TOKEN lacks "Inference Providers" permission. Go to https://huggingface.co/settings/tokens, edit your token (or create a new Fine-grained Token), and check the box: "Make calls to Inference Providers" (or create a classic "Write" token).';
      } else if (response.status === 429) {
        message = 'Hugging Face rate limit reached. Please wait or check your HF_TOKEN usage.';
      }
      throw new ExternalApiError('HuggingFace', message, response.status);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const rawContent = json.choices?.[0]?.message?.content || '{}';
    const cleaned = this.cleanJson(rawContent);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      logger.error('Failed to parse JSON from Hugging Face', { rawContent, cleaned });
      throw new ExternalApiError('HuggingFace', `Invalid JSON response from Hugging Face model: ${String(parseErr)}`);
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

    // 2. Unwrapping from container key if model wrapped object
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val && typeof val === 'object') {
          const nestedResult = input.schema.safeParse(val);
          if (nestedResult.success) {
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

    // Validation failed
    const errorDetails = directResult.error.format();
    logger.error('Hugging Face output failed Zod schema validation', { errorDetails, parsed });
    throw new ExternalApiError('HuggingFace', `Schema validation error: ${JSON.stringify(errorDetails)}`);
  }
}
