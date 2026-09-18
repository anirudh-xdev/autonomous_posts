import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/packages/database';
import { TopicRegistry } from '@/packages/trend-engine/topics/topic-registry';
import { logger } from '@/packages/config';

export async function GET() {
  try {
    await TopicRegistry.seedDefaults(prisma);

    const topics = await prisma.trendTopic.findMany({
      orderBy: [{ priority: 'asc' }, { weight: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      topics: topics.map((t) => ({
        ...t,
        keywords: JSON.parse(t.keywords || '[]'),
        relatedKeywords: JSON.parse(t.relatedKeywords || '[]'),
      })),
    });
  } catch (error) {
    logger.error('API GET /api/topics error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const trends = await prisma.trend.findMany({
      take: 20,
      select: { title: true, summary: true },
    });

    const texts = trends.map((t) => `${t.title} ${t.summary}`);
    const discovered = await TopicRegistry.discoverEmergingKeywords(prisma, texts);

    return NextResponse.json({
      success: true,
      discoveredCount: discovered.length,
      discovered,
    });
  } catch (error) {
    logger.error('API POST /api/topics error', error);
    return NextResponse.json({ success: false, error: 'Failed to trigger keyword discovery' }, { status: 500 });
  }
}
