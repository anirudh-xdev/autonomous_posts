import { prisma } from '../client';

export class ContentRepository {
  async findById(id: string) {
    return prisma.contentItem.findUnique({
      where: { id },
      include: {
        trend: { include: { evidences: true } },
        researchReport: true,
        variants: {
          include: {
            qualityChecks: true,
            publications: true,
          },
        },
      },
    });
  }

  async list(options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    return prisma.contentItem.findMany({
      where: options.status ? { status: options.status } : {},
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 50,
      skip: options.offset ?? 0,
      include: {
        trend: true,
        variants: {
          include: {
            qualityChecks: true,
            publications: true,
          },
        },
      },
    });
  }

  async createContentItem(data: {
    trendId: string;
    researchReportId: string;
    status?: string;
    variants: Array<{
      platform: 'LINKEDIN' | 'X';
      text: string;
      hook?: string;
      isThread?: boolean;
      threadPosts?: string[];
      characterCount: number;
      promptVersion?: string;
      model?: string;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.contentItem.create({
        data: {
          trendId: data.trendId,
          researchReportId: data.researchReportId,
          status: data.status ?? 'DRAFT',
        },
      });

      for (const v of data.variants) {
        await tx.contentVariant.create({
          data: {
            contentItemId: item.id,
            platform: v.platform,
            text: v.text,
            hook: v.hook,
            isThread: v.isThread ?? false,
            threadPosts: v.threadPosts ? JSON.stringify(v.threadPosts) : null,
            characterCount: v.characterCount,
            promptVersion: v.promptVersion ?? 'v1',
            model: v.model ?? 'mock',
            status: 'DRAFT',
          },
        });
      }

      return item;
    });
  }

  async updateVariant(
    variantId: string,
    data: {
      text?: string;
      hook?: string;
      isThread?: boolean;
      threadPosts?: string[];
      status?: string;
      characterCount?: number;
    }
  ) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.threadPosts) {
      updateData.threadPosts = JSON.stringify(data.threadPosts);
    }
    if (data.text && !data.characterCount) {
      updateData.characterCount = data.text.length;
    }

    return prisma.contentVariant.update({
      where: { id: variantId },
      data: updateData,
    });
  }

  async recordQualityCheck(
    variantId: string,
    result: {
      factualAccuracy: number;
      originality: number;
      developerValue: number;
      writingQuality: number;
      sourceConfidence: number;
      spamScore: number;
      overallScore: number;
      passed: boolean;
      feedback: string[];
      checks: Record<string, unknown>;
    }
  ) {
    return prisma.qualityCheck.create({
      data: {
        contentVariantId: variantId,
        factualAccuracy: result.factualAccuracy,
        originality: result.originality,
        developerValue: result.developerValue,
        writingQuality: result.writingQuality,
        sourceConfidence: result.sourceConfidence,
        spamScore: result.spamScore,
        overallScore: result.overallScore,
        passed: result.passed,
        feedback: JSON.stringify(result.feedback),
        checks: JSON.stringify(result.checks),
      },
    });
  }

  async updateItemStatus(id: string, status: string) {
    return prisma.contentItem.update({
      where: { id },
      data: { status },
    });
  }
}

export const contentRepository = new ContentRepository();
