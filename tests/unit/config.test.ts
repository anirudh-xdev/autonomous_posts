import { describe, it, expect } from 'vitest';
import { env, encryptSecret, decryptSecret, AppError, ValidationError, RateLimitError } from '@/packages/config';

describe('Phase 1: Configuration & Foundation', () => {
  it('should load valid environment defaults', () => {
    expect(env.NODE_ENV).toBeDefined();
    expect(env.PUBLISHING_MODE).toBe('APPROVAL_REQUIRED');
    expect(env.MIN_TREND_SCORE).toBe(70);
    expect(env.MIN_QUALITY_SCORE).toBe(85);
    expect(['mock', 'openrouter', 'gemini', 'openai', 'anthropic']).toContain(env.LLM_PROVIDER);
  });

  it('should properly encrypt and decrypt sensitive secrets with AES-256-GCM', () => {
    const rawSecret = 'oauth2-access-token-sample-12345!#';
    const encrypted = encryptSecret(rawSecret);

    expect(encrypted).not.toBe(rawSecret);
    expect(encrypted.split(':').length).toBe(3);

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it('should fail decryption when payload is tampered', () => {
    const rawSecret = 'secret-token';
    const encrypted = encryptSecret(rawSecret);
    const tampered = encrypted.slice(0, -2) + 'ff';

    expect(() => decryptSecret(tampered)).toThrow();
  });

  it('should preserve error hierarchy and metadata', () => {
    const validationErr = new ValidationError('Invalid inputs', { title: 'Too short' });
    expect(validationErr.statusCode).toBe(400);
    expect(validationErr.isOperational).toBe(true);

    const rateLimitErr = new RateLimitError('x-api', 60);
    expect(rateLimitErr.statusCode).toBe(429);
    expect(rateLimitErr.retryAfterSeconds).toBe(60);
  });
});
