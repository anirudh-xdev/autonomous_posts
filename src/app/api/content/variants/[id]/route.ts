import { NextResponse } from 'next/server';
import { prisma, contentRepository } from '@/packages/database';
import { qualityGateService } from '@/packages/quality-gate';
import { PublishingCoordinator } from '@/packages/publishers';
import { logger } from '@/packages/config';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as { text: string; hook?: string };
    const updated = await contentRepository.updateVariant(params.id, {
      text: body.text,
      hook: body.hook,
      characterCount: body.text.length,
    });

    // Re-run quality gate audit with new text
    const audit = await qualityGateService.auditVariant(params.id);

    return NextResponse.json({ success: true, variant: updated, audit });
  } catch (err) {
    logger.error(`API PATCH variant ${params.id} failed`, err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as { action: 'approve' | 'reject' | 'audit' | 'publish' };

    if (body.action === 'approve') {
      const updated = await prisma.contentVariant.update({
        where: { id: params.id },
        data: { status: 'APPROVED' },
      });
      return NextResponse.json({ success: true, variant: updated });
    }

    if (body.action === 'reject') {
      const updated = await prisma.contentVariant.update({
        where: { id: params.id },
        data: { status: 'REJECTED' },
      });
      return NextResponse.json({ success: true, variant: updated });
    }

    if (body.action === 'audit') {
      const audit = await qualityGateService.auditVariant(params.id);
      return NextResponse.json({ success: true, audit });
    }

    if (body.action === 'publish') {
      // First ensure it's approved or approve it
      await prisma.contentVariant.update({
        where: { id: params.id },
        data: { status: 'APPROVED' },
      });

      const pubResult = await PublishingCoordinator.publishVariant(params.id);
      return NextResponse.json({ ...pubResult });
    }

    return NextResponse.json({ success: false, error: `Unknown action '${body.action}'` }, { status: 400 });
  } catch (err) {
    logger.error(`API POST variant action failed for ${params.id}`, err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
