import { NextResponse } from 'next/server';
import { imageGeneratorService } from '@/packages/media';
import { prisma } from '@/packages/database';
import { logger } from '@/packages/config';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      customPrompt?: string;
      variantId?: string;
    };

    const contentItemId = params.id;
    const item = await prisma.contentItem.findUnique({
      where: { id: contentItemId },
      include: {
        trend: true,
        researchReport: true,
        variants: true,
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Content item not found' }, { status: 404 });
    }

    let visualConcept = item.trend?.title || 'AI Engineering System Architecture';
    if (item.visualReferences) {
      try {
        const refs = JSON.parse(item.visualReferences);
        if (Array.isArray(refs) && refs.length > 0 && refs[0].description) {
          visualConcept = `${refs[0].title}: ${refs[0].description}`;
        }
      } catch {}
    }

    logger.info(`API: generating free AI image for content item ${contentItemId}`);

    const result = await imageGeneratorService.generatePostImage({
      title: item.trend?.title || 'AI System Architecture',
      topic: (item.trend as any)?.topics?.[0]?.topic?.name || 'AI Engineering',
      visualConcept,
      customPrompt: body.customPrompt,
    });

    // Persist image URL to content item and variants
    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { imageUrl: result.imageUrl },
    });

    if (body.variantId) {
      await prisma.contentVariant.update({
        where: { id: body.variantId },
        data: { imageUrl: result.imageUrl },
      }).catch(() => {});
    } else {
      await prisma.contentVariant.updateMany({
        where: { contentItemId },
        data: { imageUrl: result.imageUrl },
      });
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      model: result.model,
      provider: result.provider,
      promptUsed: result.promptUsed,
    });
  } catch (err: any) {
    logger.error('API /api/content/[id]/generate-image failed', err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
