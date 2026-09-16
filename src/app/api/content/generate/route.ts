import { NextResponse } from 'next/server';
import { contentService } from '@/packages/content';
import { qualityGateService } from '@/packages/quality-gate';
import { prisma } from '@/packages/database';
import { logger } from '@/packages/config';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { trendId: string; customAngle?: string };
    if (!body.trendId) {
      return NextResponse.json({ success: false, error: 'trendId is required' }, { status: 400 });
    }

    const { contentItemId, result } = await contentService.generateForTrend(body.trendId, {
      customAngle: body.customAngle,
    });

    // Run quality audits on generated variants immediately
    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: { variants: true },
    });

    if (item) {
      for (const variant of item.variants) {
        await qualityGateService.auditVariant(variant.id);
      }
    }

    return NextResponse.json({ success: true, contentItemId, result });
  } catch (err) {
    logger.error('API POST /api/content/generate failed', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
