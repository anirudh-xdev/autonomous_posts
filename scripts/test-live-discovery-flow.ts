import { trendDiscoveryService } from '../src/packages/trend-engine';
import { prisma } from '../src/packages/database';

async function main() {
  console.log('--- Triggering Trend Discovery (limit: 10) ---');
  const startTime = Date.now();
  const trends = await trendDiscoveryService.runDiscovery({ limit: 10 });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Discovery completed in ${duration}s. Discovered ${trends.length} trends.`);

  console.log('\n--- Top Discovered Trends & 7-Factor Scores ---');
  for (const t of trends.slice(0, 5)) {
    console.log(`\nTitle: ${t.title}`);
    console.log(`Category: ${t.category} | Composite Score: ${t.score.toFixed(1)}/10 | Confidence: ${(t.confidence || 0.8) * 100}%`);
    console.log(`7-Factor Breakdown: [DevRel: ${t.relevanceScore?.toFixed(1) ?? 'N/A'}, Vel: ${t.velocityScore?.toFixed(1) ?? 'N/A'}, Nov: ${t.noveltyScore?.toFixed(1) ?? 'N/A'}, Auth: ${t.sourceAuthorityScore?.toFixed(1) ?? 'N/A'}, Cross: ${t.crossSourceScore?.toFixed(1) ?? 'N/A'}, Tech: ${t.technicalDepthScore?.toFixed(1) ?? 'N/A'}, Cont: ${t.contentPotentialScore?.toFixed(1) ?? 'N/A'}]`);
    if (t.whatChanged) {
      console.log(`What Changed: ${t.whatChanged}`);
    }
    if (t.recommendedAngle) {
      console.log(`Recommended Angle: ${t.recommendedAngle}`);
    }
  }

  const sourcesWithEvidence = await prisma.trendSource.findMany({
    where: { itemsFound: { gt: 0 } },
    select: { name: true, priority: true, itemsFound: true, lastSuccessAt: true }
  });
  console.log(`\nSources that produced items: ${sourcesWithEvidence.length}`);
  for (const s of sourcesWithEvidence) {
    console.log(`- [Tier ${s.priority}] ${s.name}: ${s.itemsFound} items`);
  }
}

main().catch(console.error);
