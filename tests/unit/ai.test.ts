import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { PromptManager, LLMProviderFactory, MockLLMProvider } from '@/packages/ai';

describe('Phase 3: AI Provider Abstraction & Prompt Management', () => {
  it('should load versioned prompt templates and correctly interpolate variables', () => {
    const template = PromptManager.getPrompt('linkedin.v1');
    expect(template.version).toBe('linkedin.v1');

    const rendered = PromptManager.render(template, {
      tone: 'practical, technical',
      title: 'MCP Specification Released',
      whatChanged: 'Standardized JSON-RPC protocol',
      whyItMatters: 'Interoperability for developer tools',
      developerImpact: 'Build tools once, use in all agents',
      keyFacts: ['Fact 1', 'Fact 2'],
      technicalDepth: 8,
      humorLevel: 2,
      emojiLevel: 1,
      avoidPhrases: 'None',
      preferredStructure: 'Hook -> What Changed -> Takeaway',
    });

    expect(rendered.system).toContain('practical, technical');
    expect(rendered.user).toContain('MCP Specification Released');
    expect(rendered.user).toContain('Standardized JSON-RPC protocol');
  });

  it('should return MockLLMProvider as default or safe fallback when in test mode', () => {
    const provider = LLMProviderFactory.getProvider();
    expect(provider.name).toBe('mock');
  });

  it('should produce structured outputs strictly conforming to a Zod schema via MockProvider', async () => {
    const provider = new MockLLMProvider();

    const TestSchema = z.object({
      keyFacts: z.array(z.string()),
      whatChanged: z.string(),
      whyItMatters: z.string(),
      developerImpact: z.string(),
      confidence: z.number().min(0).max(100),
    });

    const result = await provider.generateStructured({
      messages: [{ role: 'user', content: 'Research MCP trend' }],
      schema: TestSchema,
      schemaName: 'ResearchReportSchema',
    });

    expect(result.data.keyFacts.length).toBeGreaterThan(0);
    expect(result.data.confidence).toBeGreaterThanOrEqual(90);
    expect(result.tokensUsed.totalTokens).toBeGreaterThan(0);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
