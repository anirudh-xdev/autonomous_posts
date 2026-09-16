import { NextResponse } from 'next/server';
import { contentRepository } from '@/packages/database';
import { logger } from '@/packages/config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const items = await contentRepository.list({ status });
    return NextResponse.json({ success: true, count: items.length, items });
  } catch (err) {
    logger.error('API GET /api/content failed', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
