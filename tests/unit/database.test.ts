import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma, seedDatabase, trendRepository, contentRepository, agentRunRepository } from '@/packages/database';

describe('Phase 2: Database Layer & Repositories', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have seeded topics and sources correctly', async () => {
    const topics = await prisma.trendTopic.findMany();
    expect(topics.length).toBeGreaterThanOrEqual(25);

    const mcpTopic = topics.find((t) => t.slug === 'mcp');
    expect(mcpTopic).toBeDefined();
    expect(mcpTopic?.category).toBe('protocols');

    const sources = await prisma.trendSource.findMany();
    expect(sources.length).toBeGreaterThanOrEqual(6);
  });

  it('should create and retrieve a canonical trend with scoring and evidence', async () => {
    const hnSource = await prisma.trendSource.findFirst();
    expect(hnSource).toBeDefined();

    const created = await trendRepository.createOrMerge({
      title: 'Anthropic Releases Model Context Protocol (MCP) Standard',
      slug: 'anthropic-mcp-standard',
      summary: 'An open protocol enabling AI models to connect securely to developer tools and databases.',
      score: 94,
      freshnessScore: 9.5,
      developerRelevanceScore: 10,
      engagementScore: 9.0,
      noveltyScore: 9.2,
      credibilityScore: 9.8,
      scoreReason: 'Significant developer adoption across AI coding assistants and open standard publication.',
      topics: ['mcp', 'ai-developer-tools'],
      evidences: [
        {
          sourceId: hnSource!.id,
          sourceName: 'Hacker News',
          sourceUrl: 'https://news.ycombinator.com/item?id=12345678',
          rawTitle: 'Model Context Protocol (MCP) by Anthropic',
          snippet: 'Open standard for connecting AI assistants to data sources.',
          rawScore: 540,
        },
      ],
    });

    expect(created.id).toBeDefined();
    expect(created.score).toBe(94);

    const retrieved = await trendRepository.findById(created.id);
    expect(retrieved?.evidences.length).toBe(1);
    expect(retrieved?.topics.length).toBe(2);
  });

  it('should record an AgentRun for observability', async () => {
    const run = await agentRunRepository.record({
      agentType: 'RESEARCH',
      model: 'gpt-4o',
      provider: 'openai',
      promptVersion: 'v1',
      inputData: { query: 'MCP architecture' },
      outputData: { facts: ['Open protocol', 'JSON-RPC based'] },
      tokensUsed: 420,
      latencyMs: 850,
      status: 'SUCCESS',
    });

    expect(run.id).toBeDefined();
    expect(run.tokensUsed).toBe(420);
    expect(run.status).toBe('SUCCESS');
  });
});
