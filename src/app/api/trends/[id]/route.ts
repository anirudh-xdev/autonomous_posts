import { NextResponse } from 'next/server';
import { trendRepository } from '@/packages/database';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trend = await trendRepository.findById(params.id);
    if (!trend) {
      return NextResponse.json({ success: false, error: 'Trend not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      trend: {
        ...trend,
        researchReport: trend.researchReport
          ? {
              ...trend.researchReport,
              keyFacts: JSON.parse(trend.researchReport.keyFacts),
              uncertainties: JSON.parse(trend.researchReport.uncertainties),
              sources: JSON.parse(trend.researchReport.sources),
            }
          : null,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    let updated;
    if (typeof body.isSaved === 'boolean') {
      updated = await trendRepository.setIsSaved(params.id, body.isSaved);
    } else {
      updated = await trendRepository.toggleSaved(params.id);
    }
    return NextResponse.json({ success: true, trend: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
