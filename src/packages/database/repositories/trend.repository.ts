import { prisma } from '../client';
import { Trend, TrendEvidence, TrendTopic, Prisma } from '@prisma/client';

export interface CreateTrendInput {
  title: string;
  slug: string;
  summary: string;
  score: number;
  developerRelevanceScore: number;
  velocityScore?: number;
  noveltyScore: number;
  sourceAuthorityScore?: number;
  crossSourceScore?: number;
  technicalDepthScore?: number;
  contentPotentialScore?: number;
  confidence?: number;
  whatChanged?: string;
  recommendedAngle?: string;
  scoreReason?: string;
  freshnessScore?: number;
  engagementScore?: number;
  credibilityScore?: number;
  topics?: string[];
  evidences?: Array<{
    sourceId: string;
    sourceName: string;
    sourceType?: string;
    sourceUrl: string;
    externalId?: string;
    hash?: string;
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
    isSaved?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const where: Prisma.TrendWhereInput = {};
    if (options.status) where.status = options.status;
    if (options.minScore !== undefined) where.score = { gte: options.minScore };
    if (options.isSaved !== undefined) where.isSaved = options.isSaved;

    return prisma.trend.findMany({
      where,
      orderBy: [{ isSaved: 'desc' }, { score: 'desc' }],
      take: options.limit ?? 50,
      skip: options.offset ?? 0,
      include: {
        evidences: true,
        topics: { include: { topic: true } },
        researchReport: true,
      },
    });
  }

  async toggleSaved(id: string): Promise<Trend> {
    const existing = await prisma.trend.findUnique({ where: { id } });
    if (!existing) throw new Error(`Trend with id ${id} not found`);
    return prisma.trend.update({
      where: { id },
      data: { isSaved: !existing.isSaved },
    });
  }

  async setIsSaved(id: string, isSaved: boolean): Promise<Trend> {
    return prisma.trend.update({
      where: { id },
      data: { isSaved },
    });
  }

  async deleteUnsavedDiscovered(keepIds: string[] = []): Promise<number> {
    // Delete only un-saved, un-researched trends with no content items
    const toDelete = await prisma.trend.findMany({
      where: {
        isSaved: false,
        status: 'DISCOVERED',
        id: { notIn: keepIds },
        contentItems: { none: {} },
        researchReport: null,
      },
      select: { id: true },
    });

    if (toDelete.length === 0) return 0;
    const deleteIds = toDelete.map((t) => t.id);

    await prisma.trendEvidence.deleteMany({
      where: { trendId: { in: deleteIds } },
    });

    await prisma.trendToTopic.deleteMany({
      where: { trendId: { in: deleteIds } },
    });

    const res = await prisma.trend.deleteMany({
      where: { id: { in: deleteIds } },
    });

    return res.count;
  }

  async createOrMerge(input: CreateTrendInput): Promise<Trend> {
    const existing = await prisma.trend.findUnique({
      where: { slug: input.slug },
      include: { evidences: true },
    });

    if (existing) {
      // Update score if new candidate has higher score or freshness
      const updated = await prisma.trend.update({
        where: { id: existing.id },
        data: {
          score: Math.max(existing.score, input.score),
          developerRelevanceScore: Math.max(existing.developerRelevanceScore, input.developerRelevanceScore),
          velocityScore: Math.max(existing.velocityScore, input.velocityScore || 0),
          noveltyScore: Math.max(existing.noveltyScore, input.noveltyScore),
          sourceAuthorityScore: Math.max(existing.sourceAuthorityScore, input.sourceAuthorityScore || 0),
          crossSourceScore: Math.max(existing.crossSourceScore, input.crossSourceScore || 0),
          technicalDepthScore: Math.max(existing.technicalDepthScore, input.technicalDepthScore || 0),
          contentPotentialScore: Math.max(existing.contentPotentialScore, input.contentPotentialScore || 0),
          confidence: input.confidence ?? existing.confidence,
          whatChanged: input.whatChanged || existing.whatChanged,
          recommendedAngle: input.recommendedAngle || existing.recommendedAngle,
          freshnessScore: Math.max(existing.freshnessScore, input.freshnessScore || input.velocityScore || 0),
          engagementScore: Math.max(existing.engagementScore, input.engagementScore || 0),
          credibilityScore: Math.max(existing.credibilityScore, input.credibilityScore || input.sourceAuthorityScore || 0),
          scoreReason: input.scoreReason || existing.scoreReason,
          lastDetectedAt: new Date(),
        },
      });

      // Add any new evidences
      if (input.evidences && input.evidences.length > 0) {
        for (const ev of input.evidences) {
          const evExists = existing.evidences.some((e) => e.sourceUrl === ev.sourceUrl || (ev.hash && e.hash === ev.hash));
          if (!evExists) {
            await prisma.trendEvidence.create({
              data: {
                trendId: existing.id,
                sourceId: ev.sourceId,
                sourceName: ev.sourceName,
                sourceType: ev.sourceType || 'DEVELOPER',
                sourceUrl: ev.sourceUrl,
                externalId: ev.externalId,
                hash: ev.hash,
                rawTitle: ev.rawTitle,
                snippet: ev.snippet,
                author: ev.author,
                rawScore: ev.rawScore,
                publishedAt: ev.publishedAt,
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
          developerRelevanceScore: input.developerRelevanceScore,
          velocityScore: input.velocityScore ?? input.freshnessScore ?? 7.0,
          noveltyScore: input.noveltyScore,
          sourceAuthorityScore: input.sourceAuthorityScore ?? input.credibilityScore ?? 8.0,
          crossSourceScore: input.crossSourceScore ?? 7.0,
          technicalDepthScore: input.technicalDepthScore ?? input.developerRelevanceScore,
          contentPotentialScore: input.contentPotentialScore ?? 8.0,
          confidence: input.confidence ?? 88,
          whatChanged: input.whatChanged,
          recommendedAngle: input.recommendedAngle,
          scoreReason: input.scoreReason,
          freshnessScore: input.freshnessScore ?? input.velocityScore ?? 7.0,
          engagementScore: input.engagementScore ?? 7.0,
          credibilityScore: input.credibilityScore ?? input.sourceAuthorityScore ?? 8.0,
        },
      });

      if (input.evidences && input.evidences.length > 0) {
        for (const ev of input.evidences) {
          await tx.trendEvidence.create({
            data: {
              trendId: trend.id,
              sourceId: ev.sourceId,
              sourceName: ev.sourceName,
              sourceType: ev.sourceType || 'DEVELOPER',
              sourceUrl: ev.sourceUrl,
              externalId: ev.externalId,
              hash: ev.hash,
              rawTitle: ev.rawTitle,
              snippet: ev.snippet,
              author: ev.author,
              rawScore: ev.rawScore,
              publishedAt: ev.publishedAt,
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
