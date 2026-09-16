import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SafetyService, PublisherFactory, PublishingCoordinator } from '@/packages/publishers';
import { contentService } from '@/packages/content';
import { researchAgent } from '@/packages/research';
import { prisma, seedDatabase, trendRepository } from '@/packages/database';

describe('Phase 9: Social Publishers & Official APIs', () => {
  beforeAll(async () => {
    await seedDatabase();
    await prisma.publication.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should block publishing on sensitive topics via SafetyService', async () => {
    const sensitive = await SafetyService.evaluateSafety('Breaking election updates on political campaigns');
    expect(sensitive.safe).toBe(false);
    expect(sensitive.flaggedKeywords.length).toBeGreaterThanOrEqual(1);

    const safe = await SafetyService.evaluateSafety('Anthropic releases Model Context Protocol standard');
    expect(safe.safe).toBe(true);
    expect(safe.flaggedKeywords.length).toBe(0);
  });

  it('should get publishers via factory and validate platform posts', async () => {
    const linkedinPub = PublisherFactory.getPublisher('LINKEDIN');
    const xPub = PublisherFactory.getPublisher('X');

    expect(linkedinPub.platform).toBe('LINKEDIN');
    expect(xPub.platform).toBe('X');

    const validLinkedin = await linkedinPub.validatePost({
      text: 'Valid LinkedIn technical post discussing Model Context Protocol architecture with sufficient length to pass validation cleanly.',
    });
    expect(validLinkedin.valid).toBe(true);

    const invalidX = await xPub.validatePost({ text: 'a'.repeat(281) });
    expect(invalidX.valid).toBe(false);
  });

  it('should coordinate publishing of an approved post variant to database', async () => {
    // 1. Create and research trend
    const trend = await trendRepository.createOrMerge({
      title: 'Model Context Protocol Production Guide',
      slug: 'mcp-production-guide-publish-test',
      summary: 'Production deployment patterns for MCP servers.',
      score: 95,
      freshnessScore: 9.5,
      developerRelevanceScore: 10,
      engagementScore: 9.0,
      noveltyScore: 8.8,
      credibilityScore: 9.8,
      topics: ['mcp', 'ai-developer-tools'],
    });

    await researchAgent.researchTrend(trend.id);
    const { contentItemId } = await contentService.generateForTrend(trend.id);

    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: { variants: true },
    });

    const variant = item!.variants[0];

    // Approve variant
    await prisma.contentVariant.update({
      where: { id: variant.id },
      data: { status: 'APPROVED' },
    });

    // 2. Publish
    const pubResult = await PublishingCoordinator.publishVariant(variant.id);

    expect(pubResult.success).toBe(true);
    expect(pubResult.publicationId).toBeDefined();
    expect(pubResult.postUrl).toBeDefined();

    // Verify publication record in database
    const recorded = await prisma.publication.findUnique({
      where: { id: pubResult.publicationId! },
    });

    expect(recorded).toBeDefined();
    expect(recorded?.status).toBe('SUCCESS');
    expect(recorded?.postUrl).toContain('http');

    // Verify variant status updated to PUBLISHED
    const updatedVar = await prisma.contentVariant.findUnique({ where: { id: variant.id } });
    expect(updatedVar?.status).toBe('PUBLISHED');
  });
});
