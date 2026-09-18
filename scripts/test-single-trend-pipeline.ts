import { researchAgent } from '@/packages/research';
import { contentService } from '@/packages/content';
import { qualityGateService } from '@/packages/quality-gate';
import { prisma } from '@/packages/database';

async function main() {
  const trendId = 'fb00ada4-f461-42c7-8783-c6fa4111cafe';
  const trend = await prisma.trend.findUnique({
    where: { id: trendId },
    include: { evidences: true },
  });

  if (!trend) {
    console.error('Trend not found');
    return;
  }

  console.log(`Processing Real Live Trend: "${trend.title}"`);
  console.log(`URL: ${trend.evidences[0]?.sourceUrl}`);

  console.log('\n1. Running Research Agent (OpenRouter)...');
  const report = await researchAgent.researchTrend(trendId, { forceRefresh: true });
  console.log('Research complete:', {
    confidence: report.confidence,
    keyFactsCount: report.keyFacts.length,
    whatChanged: report.whatChanged.slice(0, 150),
    whyItMatters: report.whyItMatters.slice(0, 150),
  });

  console.log('\n2. Generating Platform Content (LinkedIn + X Thread)...');
  const result = await contentService.generateForTrend(trendId, { forceRegenerate: true });
  console.log(`Generated content item: ${result.contentItemId}`);

  const item = await prisma.contentItem.findUnique({
    where: { id: result.contentItemId },
    include: { variants: true },
  });

  for (const v of item?.variants || []) {
    console.log(`\n================== VARIANT [${v.platform}] ==================`);
    console.log(v.text);
    if (v.threadPosts) {
      console.log('--- Thread Posts ---');
      const posts = JSON.parse(v.threadPosts);
      posts.forEach((p: string, i: number) => console.log(`[Tweet ${i+1}]:\n${p}\n`));
    }

    const audit = await qualityGateService.auditVariant(v.id);
    console.log(`Quality Score: ${audit.overallScore}/100 | Passed: ${audit.passed}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
