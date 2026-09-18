import { researchAgent } from '@/packages/research';
import { contentService } from '@/packages/content';
import { qualityGateService } from '@/packages/quality-gate';
import { prisma } from '@/packages/database';

async function main() {
  // Find the top scored multi-source trend
  const trend = await prisma.trend.findFirst({
    where: {
      title: { contains: 'Meta' }
    },
    include: { evidences: true }
  }) || await prisma.trend.findFirst({
    orderBy: { score: 'desc' },
    include: { evidences: true }
  });

  if (!trend) {
    console.error('No trend found.');
    return;
  }

  console.log(`\n======================================================`);
  console.log(`🎯 SELECTED TREND: "${trend.title}"`);
  console.log(`Score: ${trend.score} | Evidences: ${trend.evidences.length}`);
  for (const e of trend.evidences) {
    console.log(`  - [${e.sourceName}] ${e.sourceUrl}`);
  }
  console.log(`======================================================\n`);

  console.log('🔬 1. Running Upgraded Autonomous Deep Research Agent...');
  const report = await researchAgent.researchTrend(trend.id, { forceRefresh: true });
  
  console.log('\n--- Deep Research Dossier ---');
  console.log(`Confidence: ${report.confidence}%`);
  console.log(`Key Facts (${report.keyFacts.length}):`);
  report.keyFacts.forEach((f, i) => console.log(`  ${i+1}. ${f}`));
  console.log(`\nWhat Changed:\n${report.whatChanged}`);
  console.log(`\nWhy It Matters:\n${report.whyItMatters}`);
  console.log(`\nDeveloper Impact:\n${report.developerImpact}`);
  console.log(`\nCitations (${report.sources.length}):`);
  report.sources.forEach(s => console.log(`  - ${s.title} (${s.url})`));

  console.log('\n✍️ 2. Generating High-Signal LinkedIn & X Posts...');
  const { contentItemId } = await contentService.generateForTrend(trend.id, { forceRegenerate: true });

  const item = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: { variants: true }
  });

  for (const v of item?.variants || []) {
    console.log(`\n================== VARIANT [${v.platform}] ==================`);
    console.log(v.text);
    if (v.threadPosts) {
      console.log('\n--- Thread Posts ---');
      const posts = JSON.parse(v.threadPosts);
      posts.forEach((p: string, idx: number) => console.log(`[Tweet ${idx+1}]:\n${p}\n`));
    }
    const audit = await qualityGateService.auditVariant(v.id);
    console.log(`\nQuality Score: ${audit.overallScore.toFixed(1)}/100 | Passed: ${audit.passed}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
