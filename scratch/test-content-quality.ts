import { prisma } from '../src/packages/database/client';
import { contentService } from '../src/packages/content/content.service';
import { researchAgent } from '../src/packages/research/research.agent';

async function main() {
  console.log('--- Inspecting Researched / Candidate Trends in dev.db ---');
  const trends = await prisma.trend.findMany({
    include: { researchReport: true, contentItems: { include: { variants: true } } },
    take: 10,
    orderBy: { score: 'desc' },
  });

  console.log(`Found ${trends.length} top trends:`);
  for (const t of trends) {
    console.log(`- [${t.id}] ${t.title} (Has Report: ${!!t.researchReport}, ContentItems: ${t.contentItems.length})`);
  }

  // Let's create or find:
  // Topic 1: Developer Tool (Datamimic)
  const datamimicTrend = await prisma.trend.upsert({
    where: { slug: 'datamimic-synthetic-test-data' },
    update: {},
    create: {
      title: 'Datamimic: Open-Source Synthetic Test Data Generator for Developers',
      slug: 'datamimic-synthetic-test-data',
      summary: 'Schema-driven synthetic data generation tool that integrates with CI/CD and privacy workflows.',
      score: 88,
      freshnessScore: 9.0,
      developerRelevanceScore: 9.5,
      engagementScore: 8.5,
      noveltyScore: 8.8,
      credibilityScore: 9.0,
    },
  });

  console.log(`\n--- Researching: ${datamimicTrend.title} ---`);
  await researchAgent.researchTrend(datamimicTrend.id);

  console.log(`--- Generating Content for: ${datamimicTrend.title} ---`);
  const datamimicRes = await contentService.generateForTrend(datamimicTrend.id);

  console.log('\n================== DATAMIMIC LINKEDIN POST ==================');
  console.log(`Length: ${datamimicRes.result.linkedin.text.length} chars`);
  console.log(datamimicRes.result.linkedin.text);

  console.log('\n================== DATAMIMIC X THREAD ==================');
  if (datamimicRes.result.x.posts) {
    datamimicRes.result.x.posts.forEach((p, idx) => {
      console.log(`[Tweet ${idx + 1}] (${p.length}c): ${p}\n`);
    });
  }

  // Topic 2: Model release / Architecture (DeepSeek-Reasonix)
  const modelTrend = await prisma.trend.upsert({
    where: { slug: 'deepseek-reasonix-coding-agent' },
    update: {},
    create: {
      title: 'DeepSeek-Reasonix: Terminal AI Coding Agent with Prefix-Cache Stability',
      slug: 'deepseek-reasonix-coding-agent',
      summary: 'Open-source coding agent designed specifically for DeepSeek models optimizing KV cache hit rates.',
      score: 91,
      freshnessScore: 9.2,
      developerRelevanceScore: 9.6,
      engagementScore: 8.8,
      noveltyScore: 9.1,
      credibilityScore: 9.3,
    },
  });

  console.log(`\n--- Researching: ${modelTrend.title} ---`);
  await researchAgent.researchTrend(modelTrend.id);

  console.log(`--- Generating Content for: ${modelTrend.title} ---`);
  const modelRes = await contentService.generateForTrend(modelTrend.id);

  console.log('\n================== MODEL RELEASE LINKEDIN POST ==================');
  console.log(`Length: ${modelRes.result.linkedin.text.length} chars`);
  console.log(modelRes.result.linkedin.text);

  console.log('\n================== MODEL RELEASE X THREAD ==================');
  if (modelRes.result.x.posts) {
    modelRes.result.x.posts.forEach((p, idx) => {
      console.log(`[Tweet ${idx + 1}] (${p.length}c): ${p}\n`);
    });
  }

  console.log('\n================== MODEL RELEASE RECOMMENDED VISUALS ==================');
  console.log(JSON.stringify(modelRes.result.visuals, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
