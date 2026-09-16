import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().default('file:./dev.db'),

  // Queue
  REDIS_URL: z.string().optional(),

  // LLM Provider
  LLM_PROVIDER: z.enum(['mock', 'openai', 'anthropic', 'gemini', 'openrouter']).default('mock'),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),

  // Social Integrations - LinkedIn
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_REDIRECT_URI: z.string().optional(),

  // Social Integrations - X
  X_CLIENT_ID: z.string().optional(),
  X_CLIENT_SECRET: z.string().optional(),
  X_REDIRECT_URI: z.string().optional(),

  // Web Search Provider
  WEB_SEARCH_API_KEY: z.string().optional(), // Serper, Tavily, or Bing search
  WEB_SEARCH_PROVIDER: z.enum(['mock', 'serper', 'tavily', 'duckduckgo']).default('mock'),

  // Security & Encryption
  SESSION_SECRET: z.string().min(16).default('development-session-secret-at-least-32-chars-long!'),
  ENCRYPTION_KEY: z
    .string()
    .length(64)
    .default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'), // 32-byte hex key for AES-256

  // System Automation Defaults
  PUBLISHING_MODE: z.enum(['MANUAL', 'APPROVAL_REQUIRED', 'AUTOMATIC']).default('APPROVAL_REQUIRED'),
  MIN_TREND_SCORE: z.coerce.number().min(0).max(100).default(70),
  MIN_QUALITY_SCORE: z.coerce.number().min(0).max(100).default(85),
  MAX_POSTS_PER_DAY: z.coerce.number().min(1).max(20).default(2),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
    throw new Error('Environment validation failed');
  }
  return result.data;
}

export const env = parseEnv();
