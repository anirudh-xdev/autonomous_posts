import { prisma } from '../client';
import { Trend, TrendEvidence, TrendTopic, Prisma } from '@prisma/client';

export interface CreateTrendInput {
  title: string;
  slug: string;
  summary: string;
  score: number;
  freshnessScore: number;
  developerRelevanceScore: number;
  engagementScore: number;
  noveltyScore: number;
  credibilityScore: number;
  scoreReason?: string;
  topics?: string[];
  evidences?: Array<{
    sourceId: string;
    sourceName: string;
    sourceUrl: string;
    rawTitle: string;
    snippet?: string;
    author?: string;
    rawScore?: number;
    publishedAt?: Date;
  }>;
}

export class TrendRepository {
  async findById(id: string) {
    return prisma.trend.findUnique({
      where: { id },
      include: {
        evidences: { include: { source: true } },
        topics: { include: { topic: true } },
        researchReport: true,
        contentItems: { include: { variants: true } },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.trend.findUnique({
      where: { slug },
      include: {
        evidences: true,
        topics: { include: { topic: true } },
      },
    });
  }

  async list(options: {
    status?: string;
    minScore?: number;
    limit?: number;
    offset?: number;
  } = {}) {
    const where: Prisma.TrendWhereInput = {};
    if (options.status) where.status = options.status;
    if (options.minScore !== undefined) where.score = { gte: options.minScore };

    return prisma.trend.findMany({
      where,
      orderBy: { score: 'desc' },
      take: options.limit ?? 50,
      skip: options.offset ?? 0,
      include: {
        evidences: true,
        topics: { include: { topic: true } },
        researchReport: true,
      },
    });
  }

  async createOrMerge(input: CreateTrendInput): Promise<Trend> {
    const existing = await prisma.trend.findUnique({
      where: { slug: input.slug },
      include: { evidences: true },
    });

    if (existing) {
      // Update score if new candidate has higher engagement or freshness
      const updated = await prisma.trend.update({
        where: { id: existing.id },
        data: {
          score: Math.max(existing.score, input.score),
          freshnessScore: Math.max(existing.freshnessScore, input.freshnessScore),
          engagementScore: Math.max(existing.engagementScore, input.engagementScore),
          lastDetectedAt: new Date(),
        },
      });

      // Add any new evidences
      if (input.evidences && input.evidences.length > 0) {
        for (const ev of input.evidences) {
          const evExists = existing.evidences.some((e) => e.sourceUrl === ev.sourceUrl);
          if (!evExists) {
            await prisma.trendEvidence.create({
              data: {
                trendId: existing.id,
                ...ev,
              },
            });
          }
        }
      }

      return updated;
    }

    // Create fresh trend with relations
    return prisma.$transaction(async (tx) => {
      const trend = await tx.trend.create({
        data: {
          title: input.title,
          slug: input.slug,
          summary: input.summary,
          score: input.score,
          freshnessScore: input.freshnessScore,
          developerRelevanceScore: input.developerRelevanceScore,
          engagementScore: input.engagementScore,
          noveltyScore: input.noveltyScore,
          credibilityScore: input.credibilityScore,
          scoreReason: input.scoreReason,
        },
      });

      if (input.evidences && input.evidences.length > 0) {
        for (const ev of input.evidences) {
          await tx.trendEvidence.create({
            data: {
              trendId: trend.id,
              ...ev,
            },
          });
        }
      }

      if (input.topics && input.topics.length > 0) {
        for (const topicSlug of input.topics) {
          const topic = await tx.trendTopic.findUnique({ where: { slug: topicSlug } });
          if (topic) {
            await tx.trendToTopic.create({
              data: {
                trendId: trend.id,
                topicId: topic.id,
              },
            });
          }
        }
      }

      return trend;
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.trend.update({
      where: { id },
      data: { status },
    });
  }
}

export const trendRepository = new TrendRepository();
