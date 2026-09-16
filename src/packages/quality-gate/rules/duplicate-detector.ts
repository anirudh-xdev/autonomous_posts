import { prisma } from '@/packages/database';
import { TrendNormalizer } from '@/packages/trend-engine';

export class DuplicateDetector {
  /**
   * Compares text against past published or approved posts to ensure novelty
   */
  public static async checkDuplicate(
    newText: string,
    platform: string,
    similarityThreshold = 0.65
  ): Promise<{
    isDuplicate: boolean;
    highestSimilarity: number;
    matchingPostSnippet?: string;
  }> {
    const recentVariants = await prisma.contentVariant.findMany({
      where: {
        platform,
        status: { in: ['APPROVED', 'PUBLISHED'] },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: { text: true },
    });

    if (recentVariants.length === 0) {
      return { isDuplicate: false, highestSimilarity: 0 };
    }

    const newTokens = TrendNormalizer.tokenize(newText);
    let highestSim = 0;
    let closestSnippet: string | undefined;

    for (const v of recentVariants) {
      const existingTokens = TrendNormalizer.tokenize(v.text);
      if (newTokens.size === 0 || existingTokens.size === 0) continue;

      let intersection = 0;
      for (const token of newTokens) {
        if (existingTokens.has(token)) intersection++;
      }

      const union = newTokens.size + existingTokens.size - intersection;
      const sim = union > 0 ? intersection / union : 0;

      if (sim > highestSim) {
        highestSim = sim;
        closestSnippet = v.text.slice(0, 100);
      }
    }

    return {
      isDuplicate: highestSim >= similarityThreshold,
      highestSimilarity: Math.round(highestSim * 100) / 100,
      matchingPostSnippet: closestSnippet,
    };
  }
}
