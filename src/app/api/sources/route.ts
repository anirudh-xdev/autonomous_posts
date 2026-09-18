import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/packages/database';
import { SourceRegistry } from '@/packages/trend-engine/sources/source-registry';
import { logger } from '@/packages/config';

export async function GET() {
  try {
    // Ensure default sources seeded
    await SourceRegistry.seedDefaults(prisma);

    const sources = await prisma.trendSource.findMany({
      orderBy: [{ priority: 'asc' }, { trustScore: 'desc' }],
      include: {
        _count: {
          select: { evidences: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      sources: sources.map((s) => ({
        ...s,
        topics: JSON.parse(s.topics || '[]'),
        evidenceCount: s._count.evidences,
      })),
    });
  } catch (error) {
    logger.error('API GET /api/sources error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch sources' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, enabled, trustScore, refreshInterval } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Source ID is required' }, { status: 400 });
    }

    const data: Record<string, any> = {};
    if (typeof enabled === 'boolean') data.enabled = enabled;
    if (typeof trustScore === 'number') data.trustScore = Math.min(10, Math.max(0, trustScore));
    if (typeof refreshInterval === 'number') data.refreshInterval = Math.max(15, refreshInterval);

    const updated = await prisma.trendSource.update({
      where: { id },
      data,
    });

    logger.info(`API PATCH /api/sources: updated source [${updated.name}]`, data);
    return NextResponse.json({ success: true, source: updated });
  } catch (error) {
    logger.error('API PATCH /api/sources error', error);
    return NextResponse.json({ success: false, error: 'Failed to update source' }, { status: 500 });
  }
}
