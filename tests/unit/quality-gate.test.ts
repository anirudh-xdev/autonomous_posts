import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PlatformValidator, SpamDetector, qualityGateService } from '@/packages/quality-gate';
import { contentService } from '@/packages/content';
import { researchAgent } from '@/packages/research';
import { prisma, seedDatabase, trendRepository } from '@/packages/database';

describe('Phase 7: Content Quality Gate Pipeline', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should validate platform constraints for LinkedIn and X', () => {
    const tooShortLinkedIn = PlatformValidator.validateLinkedIn('Short text');
    expect(tooShortLinkedIn.passed).toBe(false);
    expect(tooShortLinkedIn.violations[0]).toContain('too short');

    const validLinkedIn = PlatformValidator.validateLinkedIn(
      `First paragraph explaining the architecture shift for modern engineering teams.\n\nSecond paragraph breaking down why developers care about decoupling agent protocols from proprietary SDKs.\n\nThird paragraph covering the practical implementation details and how to write a custom server in TypeScript.\n\nWhat are your thoughts on open agent protocols?`
    );
    expect(validLinkedIn.passed).toBe(true);

    const tooLongX = PlatformValidator.validateX('a'.repeat(281));
    expect(tooLongX.passed).toBe(false);

    const validX = PlatformValidator.validateX('Valid tweet under 280 characters discussing MCP architecture.');
    expect(validX.passed).toBe(true);
  });

  it('should catch banned buzzwords and excessive emojis in SpamDetector', () => {
    const spamText = 'This changes everything!! 🚀🚀🚀🚀 Crazy new AI tool is a GAME CHANGER';
    const check = SpamDetector.analyze(spamText);

    expect(check.passed).toBe(false);
    expect(check.spamScore).toBeGreaterThanOrEqual(50);
    expect(check.violations.some((v) => v.includes('this changes everything'))).toBe(true);
    expect(check.violations.some((v) => v.includes('Excessive emojis'))).toBe(true);
  });

  it('should audit a generated content variant and record quality check in database', async () => {
    // 1. Create and research trend
    const trend = await trendRepository.createOrMerge({
      title: 'Model Context Protocol Standards Auditing',
      slug: 'mcp-audit-test-slug',
      summary: 'Open protocol for connecting AI models to developer tools.',
      score: 91,
      freshnessScore: 9,
      developerRelevanceScore: 10,
      engagementScore: 9,
      noveltyScore: 8,
      credibilityScore: 9,
      topics: ['mcp'],
    });

    await researchAgent.researchTrend(trend.id);
    const { contentItemId } = await contentService.generateForTrend(trend.id);

    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: { variants: true },
    });

    const linkedinVariant = item!.variants.find((v) => v.platform === 'LINKEDIN')!;
    const audit = await qualityGateService.auditVariant(linkedinVariant.id);

    expect(audit.overallScore).toBeGreaterThanOrEqual(80);
    expect(audit.factualAccuracy).toBeGreaterThanOrEqual(90);
    expect(audit.feedback.length).toBeGreaterThanOrEqual(0);

    // Verify database record
    const recorded = await prisma.qualityCheck.findFirst({
      where: { contentVariantId: linkedinVariant.id },
    });

    expect(recorded).toBeDefined();
    expect(recorded?.overallScore).toBe(audit.overallScore);
  });
});
