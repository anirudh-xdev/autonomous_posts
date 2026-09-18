import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { LLMProviderFactory, HuggingFaceProvider } from '../../src/packages/ai';
import { imageGeneratorService } from '../../src/packages/media';

describe('Phase 10: Hugging Face & Free Media Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    LLMProviderFactory.reset();
  });

  afterEach(() => {
    process.env = originalEnv;
    LLMProviderFactory.reset();
    vi.restoreAllMocks();
  });

  it('should instantiate HuggingFaceProvider and register in LLMProviderFactory', () => {
    const provider = new HuggingFaceProvider('hf_mock_token_for_testing');
    expect(provider.name).toBe('huggingface');

    process.env.HUGGINGFACE_API_KEY = 'hf_mock_test_token';
    const resolved = LLMProviderFactory.getProvider('huggingface');
    expect(resolved.name).toBe('huggingface');
  });

  it('should craft structured technical visual prompts for AI architecture diagrams', () => {
    const prompt = imageGeneratorService.craftPrompt({
      title: 'Model Context Protocol (MCP) Client-Server Architecture',
      topic: 'AI Developer Tools',
      visualConcept: 'Host client connecting to local tools and database servers via JSON-RPC',
    });

    expect(prompt).toContain('Model Context Protocol');
    expect(prompt).toContain('dark mode');
    expect(prompt).toContain('architecture diagram');
  });

  it('should use custom prompt when provided', () => {
    const custom = 'Isometric cybernetic blueprint of speculative decoding transformer heads';
    const prompt = imageGeneratorService.craftPrompt({
      title: 'Speculative Decoding',
      customPrompt: custom,
    });

    expect(prompt).toBe(custom);
  });

  it('should generate and save an image via free serverless image engine', async () => {
    // Mock fetch for image generation to test file writing and url generation
    const mockPngBuffer = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]); // Valid PNG magic bytes

    vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => mockPngBuffer.buffer,
        text: async () => '',
        json: async () => ({}),
      } as any;
    });

    const result = await imageGeneratorService.generatePostImage({
      title: 'Test AI Architecture',
      topic: 'LLM Systems',
    });

    expect(result.imageUrl).toMatch(/^\/generated-images\/visual-\d+-[a-f0-9]+\.png$/);
    expect(fs.existsSync(result.fullLocalPath)).toBe(true);

    // Clean up test generated file
    if (fs.existsSync(result.fullLocalPath)) {
      fs.unlinkSync(result.fullLocalPath);
    }
  });
});
