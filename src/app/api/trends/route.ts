import { NextResponse } from 'next/server';
import { trendRepository, prisma } from '@/packages/database';
import { trendDiscoveryService } from '@/packages/trend-engine';
import { logger } from '@/packages/config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minScore = searchParams.get('minScore') ? Number(searchParams.get('minScore')) : undefined;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const isSavedParam = searchParams.get('isSaved');
    const isSaved = isSavedParam !== null ? isSavedParam === 'true' : undefined;

    const trends = await trendRepository.list({ minScore, status, limit, isSaved });
    return NextResponse.json({ success: true, count: trends.length, trends });
  } catch (err) {
    logger.error('API GET /api/trends failed', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    logger.info('API POST /api/trends - triggering trend discovery');
    const body = await request.json().catch(() => ({}));
    const limit = typeof body?.limit === 'number' ? body.limit : 10;
    const replaceUnsaved = typeof body?.replaceUnsaved === 'boolean' ? body.replaceUnsaved : true;

    const result = await trendDiscoveryService.runDiscovery({ limit, replaceUnsaved });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    logger.error('API POST /api/trends discovery trigger failed', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
