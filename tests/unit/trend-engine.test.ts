import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  TrendScorer,
  TrendNormalizer,
  TrendClusterer,
  TrendCandidate,
  SignalDeduper,
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

  it('should compute transparent 7-factor scores according to the blueprint formula', () => {
    const scorer = new TrendScorer();

    // developer_relevance * 0.25 + velocity * 0.20 + novelty * 0.15 + source_authority * 0.15 +
    // cross_source * 0.10 + technical_depth * 0.10 + content_potential * 0.05
    const score = scorer.calculateScore({
      developerRelevance: 10,  // 10 * 0.25 = 2.5
      velocity: 9,            // 9 * 0.20  = 1.8
      novelty: 8,             // 8 * 0.15  = 1.2
      sourceAuthority: 9,     // 9 * 0.15  = 1.35
      crossSource: 9,         // 9 * 0.10  = 0.9
      technicalDepth: 9,      // 9 * 0.10  = 0.9
      contentPotential: 8,    // 8 * 0.05  = 0.4
      // sum = 2.5 + 1.8 + 1.2 + 1.35 + 0.9 + 0.9 + 0.4 = 9.05 -> * 10 = 90.5
    });

    expect(score).toBe(90.5);

    const reason = scorer.generateScoreReason({
      developerRelevance: 10,
      velocity: 9,
      novelty: 8,
      sourceAuthority: 9,
      crossSource: 9,
      technicalDepth: 9,
      contentPotential: 8,
      totalScore: 90.5,
      evidenceCount: 4,
      independentTierCount: 3,
    });

    expect(reason).toContain('workflows');
    expect(reason).toContain('primary AI research labs');
    expect(reason).toContain('3 independent source tiers');
  });

  it('should deduplicate signals across 4 layers and generate deterministic SHA-256 hashes', () => {
    const rawSignals = [
      {
        externalId: '1',
        title: 'Anthropic Launches Model Context Protocol',
        summary: 'MCP enables agents to connect to dev tools',
        url: 'https://anthropic.com/news/mcp?utm_source=twitter&utm_medium=social',
        canonicalUrl: '',
        source: 'Anthropic Blog',
        sourceType: 'PRIMARY' as const,
        sourceTrustScore: 10.0,
        engagement: {},
        topics: ['mcp'],
        hash: '',
      },
      {
        externalId: '2',
        title: 'Anthropic Launches Model Context Protocol', // Exact duplicate canonical URL + title
        summary: 'MCP enables agents to connect to dev tools',
        url: 'https://anthropic.com/news/mcp?fbclid=xyz&ref=hn',
        canonicalUrl: '',
        source: 'Aggregator',
        sourceType: 'COMMUNITY' as const,
        sourceTrustScore: 7.0,
        engagement: {},
        topics: ['mcp'],
        hash: '',
      },
      {
        externalId: '3',
        title: 'Anthropic Launches Model Context Protocol Standard for Agents', // Title similarity > 0.8
        summary: 'Discussion of MCP',
        url: 'https://another-blog.com/mcp-announcement',
        canonicalUrl: '',
        source: 'Blog',
        sourceType: 'DEVELOPER' as const,
        sourceTrustScore: 8.5,
        engagement: {},
        topics: ['mcp'],
        hash: '',
      },
      {
        externalId: '4',
        title: 'DeepSeek-V3 Architecture Breakthrough',
        summary: 'DeepSeek releases new model with multi-head latent attention',
        url: 'https://deepseek.com/v3',
        canonicalUrl: '',
        source: 'DeepSeek',
        sourceType: 'PRIMARY' as const,
        sourceTrustScore: 10.0,
        engagement: {},
        topics: ['models'],
        hash: '',
      },
    ];

    const deduplicated = SignalDeduper.deduplicateSignals(rawSignals);
    expect(deduplicated.length).toBe(2);
    expect(deduplicated[0].canonicalUrl).toBe('https://anthropic.com/news/mcp');
    expect(deduplicated[0].hash).toBeDefined();
    expect(deduplicated[1].title).toContain('DeepSeek-V3');
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
    expect(mcpGroup?.score).toBeGreaterThanOrEqual(88);
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
