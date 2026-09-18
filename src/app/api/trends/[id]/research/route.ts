import { NextResponse } from 'next/server';
import { researchAgent } from '@/packages/research';
import { logger } from '@/packages/config';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const report = await researchAgent.researchTrend(params.id, { forceRefresh: true });
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    logger.error(`API research failed for trend ${params.id}`, err);
    const status = err?.statusCode || 500;
    const message = err?.message || String(err);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
