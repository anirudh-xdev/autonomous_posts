import { trendDiscoveryService } from '@/packages/trend-engine';
import { prisma } from '@/packages/database';

async function main() {
  console.log('Testing 100% Live Discovery Across All Sources...\n');
  const result = await trendDiscoveryService.runDiscovery();
  console.log(`\nResult: ${result.rawCandidatesFound} raw candidates found, ${result.canonicalTrendsSaved} canonical trends saved.`);

  const recentTrends = await prisma.trend.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { evidences: true }
  });

  console.log('\nTop Recent Trends in DB:');
  for (const t of recentTrends) {
    console.log(`\n- [Score: ${t.score}] "${t.title}"`);
    console.log(`  Status: ${t.status}`);
    console.log(`  Evidences (${t.evidences.length}):`);
    for (const e of t.evidences) {
      console.log(`    - [${e.sourceName}] ${e.sourceUrl}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
