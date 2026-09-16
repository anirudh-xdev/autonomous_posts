import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  TrendScorer,
  TrendNormalizer,
  TrendClusterer,
  TrendCandidate,
  trendDiscoveryService,
} from '@/packages/trend-engine';
import { prisma, seedDatabase, trendRepository } from '@/packages/database';

describe('Phase 4: Trend Discovery & Scoring Engine', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should compute transparent 5-factor scores and explain reasons', () => {
    const scorer = new TrendScorer();

    const score = scorer.calculateScore({
      freshnessScore: 9,
      developerRelevanceScore: 10,
      engagementScore: 9,
      noveltyScore: 8,
      credibilityScore: 9,
    });

    // 9*0.2 + 10*0.25 + 9*0.2 + 8*0.15 + 9*0.2 = 1.8 + 2.5 + 1.8 + 1.2 + 1.8 = 9.1 -> 91
    expect(score).toBe(91);

    const reason = scorer.generateScoreReason({
      freshnessScore: 9,
      developerRelevanceScore: 10,
      engagementScore: 9,
      noveltyScore: 8,
      credibilityScore: 9,
      totalScore: 91,
      evidenceCount: 3,
    });

    expect(reason).toContain('developer workflows');
    expect(reason).toContain('primary sources');
    expect(reason).toContain('Merged across 3 independent sources');
  });

  it('should canonicalize URLs and clean tracking query parameters', () => {
    const messyUrl =
      'https://anthropic.com/news/model-context-protocol/?utm_source=twitter&utm_medium=social&utm_campaign=launch#section-1';
    const clean = TrendNormalizer.canonicalizeUrl(messyUrl);
    expect(clean).toBe('https://anthropic.com/news/model-context-protocol');

    const cleanTitle = TrendNormalizer.normalizeTitle('[Show HN] MCP: An Open Protocol for AI Agents | TechCrunch');
    expect(cleanTitle).toBe('MCP: An Open Protocol for AI Agents');
  });

  it('should cluster multiple source candidates of the same event into one canonical trend', () => {
    const candidates: TrendCandidate[] = [
      {
        title: 'Anthropic Launches Model Context Protocol Standard',
        summary: 'An open protocol for AI assistants to access developer tools.',
        sourceUrl: 'https://anthropic.com/news/mcp?utm_source=rss',
        sourceName: 'Anthropic Blog',
        topics: ['mcp', 'ai-developer-tools'],
        freshnessScore: 9.5,
        engagementScore: 8.5,
        developerRelevanceScore: 9.8,
        noveltyScore: 9.0,
        credibilityScore: 9.8,
        totalScore: 92,
      },
      {
        title: 'Show HN: Model Context Protocol (MCP) by Anthropic',
        summary: 'Discussion of Anthropic open-sourcing Model Context Protocol for developers.',
        sourceUrl: 'https://news.ycombinator.com/item?id=42234058',
        sourceName: 'Hacker News',
        topics: ['mcp', 'ai-agents'],
        freshnessScore: 9.2,
        engagementScore: 9.4,
        developerRelevanceScore: 9.7,
        noveltyScore: 8.8,
        credibilityScore: 9.2,
        totalScore: 91,
      },
      {
        title: 'Unrelated: vLLM Speculative Decoding Updates',
        summary: 'Throughput improvements in vLLM.',
        sourceUrl: 'https://vllm.ai/blog',
        sourceName: 'vLLM',
        topics: ['inference'],
        freshnessScore: 8.0,
        engagementScore: 7.5,
        developerRelevanceScore: 8.5,
        noveltyScore: 7.8,
        credibilityScore: 9.0,
        totalScore: 82,
      },
    ];

    const clusterer = new TrendClusterer();
    const groups = clusterer.cluster(candidates);

    // The two MCP items should be clustered together, separate from vLLM
    expect(groups.length).toBe(2);

    const mcpGroup = groups.find((g) => g.canonicalTitle.includes('Model Context Protocol'));
    expect(mcpGroup).toBeDefined();
    expect(mcpGroup?.evidences.length).toBe(2);
    expect(mcpGroup?.score).toBeGreaterThan(90);
  });

  it('should run full discovery pipeline and save clustered trends with multiple evidences', async () => {
    const result = await trendDiscoveryService.runDiscovery({ limitPerSource: 5 });

    expect(result.rawCandidatesFound).toBeGreaterThan(0);
    expect(result.canonicalTrendsSaved).toBeGreaterThan(0);

    const savedTrends = await trendRepository.list({ minScore: 60 });
    expect(savedTrends.length).toBeGreaterThan(0);

    const highScorer = savedTrends[0];
    expect(highScorer.score).toBeGreaterThanOrEqual(60);
    expect(highScorer.evidences.length).toBeGreaterThanOrEqual(1);
    expect(highScorer.scoreReason).toBeDefined();
  });
});
