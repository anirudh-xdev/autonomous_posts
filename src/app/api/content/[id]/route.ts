import { NextResponse } from 'next/server';
import { contentRepository } from '@/packages/database';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const item = await contentRepository.findById(params.id);
    if (!item) {
      return NextResponse.json({ success: false, error: 'Content item not found' }, { status: 404 });
    }

    const formattedVariants = item.variants.map((v) => ({
      ...v,
      threadPosts: v.threadPosts ? JSON.parse(v.threadPosts) : null,
      qualityChecks: v.qualityChecks.map((q) => ({
        ...q,
        feedback: JSON.parse(q.feedback),
        checks: JSON.parse(q.checks),
      })),
    }));

    return NextResponse.json({
      success: true,
      contentItem: {
        ...item,
        variants: formattedVariants,
        researchReport: item.researchReport
          ? {
              ...item.researchReport,
              keyFacts: JSON.parse(item.researchReport.keyFacts),
              uncertainties: JSON.parse(item.researchReport.uncertainties),
              sources: JSON.parse(item.researchReport.sources),
            }
          : null,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
