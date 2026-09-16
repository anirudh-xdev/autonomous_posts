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

    const trends = await trendRepository.list({ minScore, status });
    return NextResponse.json({ success: true, count: trends.length, trends });
  } catch (err) {
    logger.error('API GET /api/trends failed', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST() {
  try {
    logger.info('API POST /api/trends - triggering trend discovery');
    const result = await trendDiscoveryService.runDiscovery();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    logger.error('API POST /api/trends discovery trigger failed', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
