import { z } from 'zod';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  text: string;
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  model: string;
  provider: string;
}

export interface StructuredLLMRequest<T> extends LLMRequest {
  schema: z.ZodType<T, z.ZodTypeDef, any>;
  schemaName: string;
}

export interface StructuredLLMResponse<T> {
  data: T;
  rawText: string;
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  model: string;
  provider: string;
}

export interface LLMProvider {
  name: string;
  generateText(input: LLMRequest): Promise<LLMResponse>;
  generateStructured<T>(input: StructuredLLMRequest<T>): Promise<StructuredLLMResponse<T>>;
}
