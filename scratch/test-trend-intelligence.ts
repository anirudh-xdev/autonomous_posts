import { trendDiscoveryService } from '@/packages/trend-engine';
import { prisma } from '@/packages/database';

async function main() {
  console.log('=== Testing 5-Tier AI Trend Source Intelligence & Scoring ===');
  
  const result = await trendDiscoveryService.runDiscovery({ limit: 10 });
  console.log('Discovery result:', result);

  const sources = await prisma.trendSource.findMany({
    select: { name: true, type: true, trustScore: true, enabled: true, itemsFound: true, lastError: true },
  });
  console.log(`\nSources in registry (${sources.length}):`);
  for (const s of sources.slice(0, 8)) {
    console.log(`- [${s.type}] ${s.name} (Trust: ${s.trustScore}, Items: ${s.itemsFound}, Enabled: ${s.enabled})`);
  }

  const topics = await prisma.trendTopic.findMany({
    select: { name: true, category: true, keywords: true, relatedKeywords: true },
  });
  console.log(`\nTopics in registry (${topics.length}):`);
  for (const t of topics.slice(0, 6)) {
    console.log(`- #${t.name} (${t.category}) | Related: ${t.relatedKeywords}`);
  }

  const topTrends = await prisma.trend.findMany({
    take: 3,
    orderBy: { score: 'desc' },
    include: { evidences: true },
  });

  console.log(`\nTop Discovered Trends:`);
  for (const trend of topTrends) {
    console.log(`\n🔥 ${trend.title}`);
    console.log(`Score: ${Math.round(trend.score)}/100 | Confidence: ${trend.confidence}%`);
    console.log(`7-Factor Breakdown:`);
    console.log(`  Dev Relevance: ${trend.developerRelevanceScore}/10 (25%)`);
    console.log(`  Velocity:      ${trend.velocityScore}/10 (20%)`);
    console.log(`  Novelty:       ${trend.noveltyScore}/10 (15%)`);
    console.log(`  Authority:     ${trend.sourceAuthorityScore}/10 (15%)`);
    console.log(`  Cross-Source:  ${trend.crossSourceScore}/10 (10%)`);
    console.log(`  Tech Depth:    ${trend.technicalDepthScore}/10 (10%)`);
    console.log(`  Content Pot:   ${trend.contentPotentialScore}/10 (5%)`);
    console.log(`What Changed: ${trend.whatChanged || 'None recorded'}`);
    console.log(`Recommended Angle: ${trend.recommendedAngle || 'None recorded'}`);
    console.log(`Signals: ${trend.evidences.length} evidences [${trend.evidences.map(e => e.sourceType).join(', ')}]`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test run failed', err);
    process.exit(1);
  });
