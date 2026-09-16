import { queueManager } from '../queue.manager';
import {
  DiscoverTrendsJobPayload,
  ResearchTrendJobPayload,
  GenerateContentJobPayload,
  QualityCheckJobPayload,
  PublishPostJobPayload,
} from '../types';
import { trendDiscoveryService } from '@/packages/trend-engine';
import { researchAgent } from '@/packages/research';
import { contentService } from '@/packages/content';
import { qualityGateService } from '@/packages/quality-gate';
import { prisma } from '@/packages/database';
import { logger, env } from '@/packages/config';

export function registerAllWorkerHandlers() {
  logger.info('Registering background pipeline worker handlers...');

  // 1. Discover Trends Worker
  queueManager.registerHandler<DiscoverTrendsJobPayload>('discover-trends', async (payload) => {
    logger.info('Worker: executing [discover-trends] job');
    const result = await trendDiscoveryService.runDiscovery(payload);

    // Auto-chain: Find top newly discovered trends above threshold
    const topTrends = await prisma.trend.findMany({
      where: {
        score: { gte: env.MIN_TREND_SCORE },
        status: 'DISCOVERED',
      },
      take: 3,
    });

    for (const t of topTrends) {
      logger.info(`Chaining high-value trend ${t.id} ("${t.title}") to research queue`);
      await queueManager.addJob<ResearchTrendJobPayload>('research-queue', 'research-trend', {
        trendId: t.id,
      });
    }

    return result;
  });

  // 2. Research Trend Worker
  queueManager.registerHandler<ResearchTrendJobPayload>('research-trend', async (payload) => {
    logger.info(`Worker: executing [research-trend] for trend ${payload.trendId}`);
    const report = await researchAgent.researchTrend(payload.trendId, { forceRefresh: payload.forceRefresh });

    // Auto-chain: If research confidence is high, queue content generation
    if (report.confidence >= 75) {
      logger.info(`Chaining researched trend ${payload.trendId} to content generation queue`);
      await queueManager.addJob<GenerateContentJobPayload>('content-queue', 'generate-content', {
        trendId: payload.trendId,
      });
    }

    return report;
  });

  // 3. Generate Content Worker
  queueManager.registerHandler<GenerateContentJobPayload>('generate-content', async (payload) => {
    logger.info(`Worker: executing [generate-content] for trend ${payload.trendId}`);
    const { contentItemId } = await contentService.generateForTrend(payload.trendId, {
      customAngle: payload.customAngle,
    });

    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: { variants: true },
    });

    // Auto-chain: Run quality checks on all generated variants
    if (item && item.variants) {
      for (const variant of item.variants) {
        logger.info(`Chaining variant ${variant.id} (${variant.platform}) to quality check queue`);
        await queueManager.addJob<QualityCheckJobPayload>('quality-queue', 'quality-check', {
          variantId: variant.id,
        });
      }
    }

    return { contentItemId };
  });

  // 4. Quality Check Worker
  queueManager.registerHandler<QualityCheckJobPayload>('quality-check', async (payload) => {
    logger.info(`Worker: executing [quality-check] for variant ${payload.variantId}`);
    const audit = await qualityGateService.auditVariant(payload.variantId);

    // If publishing mode is AUTOMATIC and audit passed, queue publish
    if (env.PUBLISHING_MODE === 'AUTOMATIC' && audit.passed) {
      const variant = await prisma.contentVariant.findUnique({ where: { id: payload.variantId } });
      if (variant) {
        logger.info(`Automatic mode: variant ${variant.id} passed quality gate. Queuing publish job.`);
        await queueManager.addJob<PublishPostJobPayload>('publishing-queue', 'publish-post', {
          variantId: variant.id,
          platform: variant.platform as 'LINKEDIN' | 'X',
        });
      }
    }

    return audit;
  });

  logger.info('✅ All background worker handlers registered successfully.');
}
