import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SourceReader, researchAgent } from '@/packages/research';
import { prisma, seedDatabase, trendRepository } from '@/packages/database';

describe('Phase 5: Research Agent', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should clean HTML tags and extract readable text', () => {
    const rawHtml = `
      <html>
        <head><title>Test</title><style>.foo { color: red; }</style></head>
        <body>
          <nav><a>Home</a></nav>
          <h1>Model Context Protocol Released</h1>
          <p>Anthropic has officially introduced <strong>MCP</strong> as an open protocol.</p>
          <script>console.log("secret")</script>
        </body>
      </html>
    `;

    const cleaned = SourceReader.cleanHtml(rawHtml);
    expect(cleaned).toContain('Model Context Protocol Released');
    expect(cleaned).toContain('Anthropic has officially introduced MCP as an open protocol');
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).not.toContain('.foo');
  });

  it('should execute research on a discovered trend and generate structured report', async () => {
    // Create a trend to research
    const trend = await trendRepository.createOrMerge({
      title: 'Anthropic Model Context Protocol (MCP) Announced',
      slug: 'anthropic-mcp-announced-test',
      summary: 'Anthropic introduces open standard connecting LLMs with developer tools.',
      score: 95,
      freshnessScore: 9.8,
      developerRelevanceScore: 10,
      engagementScore: 9.2,
      noveltyScore: 9.0,
      credibilityScore: 9.8,
      topics: ['mcp', 'ai-developer-tools'],
      evidences: [
        {
          sourceId: (await prisma.trendSource.findFirst())!.id,
          sourceName: 'Anthropic News',
          sourceUrl: 'https://anthropic.com/news/model-context-protocol',
          rawTitle: 'Model Context Protocol Announcement',
          snippet: 'Universal open protocol for agent tool integration.',
        },
      ],
    });

    const report = await researchAgent.researchTrend(trend.id);

    expect(report.keyFacts.length).toBeGreaterThanOrEqual(2);
    expect(report.whatChanged).toBeDefined();
    expect(report.whyItMatters).toBeDefined();
    expect(report.developerImpact).toBeDefined();
    expect(report.confidence).toBeGreaterThanOrEqual(80);
    expect(report.sources.length).toBeGreaterThanOrEqual(1);

    // Verify database record
    const updatedTrend = await prisma.trend.findUnique({
      where: { id: trend.id },
      include: { researchReport: true },
    });

    expect(updatedTrend?.status).toBe('RESEARCHED');
    expect(updatedTrend?.researchReport).toBeDefined();
    expect(JSON.parse(updatedTrend!.researchReport!.keyFacts).length).toBe(report.keyFacts.length);

    // Verify AgentRun was recorded
    const recentRun = await prisma.agentRun.findFirst({
      where: { agentType: 'RESEARCH' },
      orderBy: { createdAt: 'desc' },
    });

    expect(recentRun).toBeDefined();
    expect(recentRun?.status).toBe('SUCCESS');
  });
});
