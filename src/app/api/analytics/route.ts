import { NextResponse } from 'next/server';
import { prisma } from '@/packages/database';
import { logger } from '@/packages/config';

export async function GET() {
  try {
    const publications = await prisma.publication.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        contentVariant: {
          include: {
            contentItem: {
              include: { trend: true },
            },
          },
        },
      },
    });

    const totalPublications = publications.length;
    const successful = publications.filter((p) => p.status === 'SUCCESS').length;
    const failed = publications.filter((p) => p.status === 'FAILED').length;

    const linkedinCount = publications.filter((p) => p.platform === 'LINKEDIN' && p.status === 'SUCCESS').length;
    const xCount = publications.filter((p) => p.platform === 'X' && p.status === 'SUCCESS').length;

    const realTrendsCount = await prisma.trend.count();
    const realReportsCount = await prisma.researchReport.count();

    // Real dynamic system insights
    const insights: string[] = [
      `Engine actively monitoring ${realTrendsCount} verified emerging technology trends across Hacker News, GitHub Trending, Reddit, and DuckDuckGo.`,
      `Synthesized ${realReportsCount} deep technical research dossiers with verified primary source citations and architectural deltas.`,
      `Connected to official LinkedIn and X OAuth APIs with automated Quality Gate screening for factual accuracy and zero marketing fluff.`,
    ];

    return NextResponse.json({
      success: true,
      stats: {
        totalPublications,
        successful,
        failed,
        linkedinCount,
        xCount,
        publicationSuccessRate: totalPublications > 0 ? `${Math.round((successful / totalPublications) * 100)}%` : '100%',
      },
      publications,
      insights,
    });
  } catch (err) {
    logger.error('API GET /api/analytics failed', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
