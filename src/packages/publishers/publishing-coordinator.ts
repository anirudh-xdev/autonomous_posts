import { PublisherFactory } from './publisher.factory';
import { SafetyService } from './safety.service';
import { prisma } from '@/packages/database';
import { logger, ValidationError, env } from '@/packages/config';

export class PublishingCoordinator {
  /**
   * Publishes an approved content variant to its designated platform
   */
  public static async publishVariant(variantId: string): Promise<{
    success: boolean;
    publicationId?: string;
    postUrl?: string;
    error?: string;
  }> {
    const variant = await prisma.contentVariant.findUnique({
      where: { id: variantId },
      include: {
        contentItem: {
          include: { trend: { include: { topics: { include: { topic: true } } } } },
        },
      },
    });

    if (!variant) {
      throw new ValidationError(`Variant with id ${variantId} not found`);
    }

    const platform = variant.platform as 'LINKEDIN' | 'X';
    const trend = variant.contentItem.trend;
    const topicSlugs = trend.topics.map((t) => t.topic.slug);

    // 1. Safety Screen
    const safety = await SafetyService.evaluateSafety(variant.text, topicSlugs);
    if (!safety.safe) {
      logger.warn(`Publishing blocked by safety filter for variant ${variantId}: ${safety.reason}`);
      return { success: false, error: safety.reason };
    }

    // 2. Check Daily Post Limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const publicationsToday = await prisma.publication.count({
      where: {
        status: 'SUCCESS',
        publishedAt: { gte: today },
      },
    });

    if (publicationsToday >= env.MAX_POSTS_PER_DAY) {
      const msg = `Daily post limit reached (${publicationsToday}/${env.MAX_POSTS_PER_DAY}). Postponing publication.`;
      logger.warn(msg);
      return { success: false, error: msg };
    }

    // 3. Dispatch to Publisher
    const publisher = PublisherFactory.getPublisher(platform);
    const threadPosts = variant.threadPosts ? JSON.parse(variant.threadPosts) : undefined;

    const result = await publisher.publishPost({
      text: variant.text,
      isThread: variant.isThread,
      threadPosts,
      variantId: variant.id,
    });

    // 4. Record Publication in Database
    const pub = await prisma.publication.create({
      data: {
        contentVariantId: variant.id,
        platform,
        platformPostId: result.platformPostId,
        postUrl: result.postUrl,
        status: result.success ? 'SUCCESS' : 'FAILED',
        error: result.error,
        publishedAt: result.success ? new Date() : null,
      },
    });

    if (result.success) {
      await prisma.contentVariant.update({
        where: { id: variant.id },
        data: { status: 'PUBLISHED' },
      });

      await prisma.contentItem.update({
        where: { id: variant.contentItemId },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });

      logger.info(`🎉 Publication successfully completed for variant ${variant.id} on ${platform}`);
    }

    return {
      success: result.success,
      publicationId: pub.id,
      postUrl: result.postUrl,
      error: result.error,
    };
  }
}
