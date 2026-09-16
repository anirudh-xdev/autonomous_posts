import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { VoiceProfileService, contentService } from '@/packages/content';
import { researchAgent } from '@/packages/research';
import { prisma, seedDatabase, trendRepository } from '@/packages/database';

describe('Phase 6: Content Generation Engine', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should load default voice profile and support updates', async () => {
    const profile = await VoiceProfileService.getActiveProfile();
    expect(profile.name).toBe('Default Technical Voice');
    expect(profile.technicalDepth).toBe(7);
    expect(profile.avoidPhrases).toContain('This changes everything');

    if (profile.id) {
      await VoiceProfileService.updateProfile(profile.id, { technicalDepth: 8 });
      const updated = await VoiceProfileService.getActiveProfile();
      expect(updated.technicalDepth).toBe(8);
      // Restore
      await VoiceProfileService.updateProfile(profile.id, { technicalDepth: 7 });
    }
  });

  it('should generate high-quality LinkedIn post and X thread for a researched trend', async () => {
    // 1. Create trend
    const trend = await trendRepository.createOrMerge({
      title: 'Anthropic Model Context Protocol (MCP) Standard',
      slug: 'anthropic-mcp-content-test',
      summary: 'Open protocol for connecting AI models to developer tools.',
      score: 93,
      freshnessScore: 9.5,
      developerRelevanceScore: 9.8,
      engagementScore: 9.0,
      noveltyScore: 9.1,
      credibilityScore: 9.7,
      topics: ['mcp', 'ai-developer-tools'],
      evidences: [
        {
          sourceId: (await prisma.trendSource.findFirst())!.id,
          sourceName: 'Anthropic Blog',
          sourceUrl: 'https://anthropic.com/news/mcp-standard',
          rawTitle: 'MCP Announcement',
        },
      ],
    });

    // 2. Run research
    await researchAgent.researchTrend(trend.id);

    // 3. Generate content
    const { contentItemId, result } = await contentService.generateForTrend(trend.id);

    expect(contentItemId).toBeDefined();
    expect(result.linkedin.text.length).toBeGreaterThanOrEqual(100);
    expect(result.linkedin.hook).toBeDefined();

    expect(result.x.text.length).toBeLessThanOrEqual(280);
    expect(result.x.isThread).toBe(true);
    expect(result.x.posts?.length).toBeGreaterThanOrEqual(3);
    for (const post of result.x.posts || []) {
      expect(post.length).toBeLessThanOrEqual(280);
    }

    // Verify database item and variants
    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: { variants: true },
    });

    expect(item?.status).toBe('DRAFT');
    expect(item?.variants.length).toBe(2);

    const linkedinVar = item?.variants.find((v) => v.platform === 'LINKEDIN');
    const xVar = item?.variants.find((v) => v.platform === 'X');

    expect(linkedinVar).toBeDefined();
    expect(xVar).toBeDefined();
    expect(linkedinVar?.characterCount).toBe(result.linkedin.text.length);
  });
});
