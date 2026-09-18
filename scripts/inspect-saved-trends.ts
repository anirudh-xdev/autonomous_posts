import { prisma } from '../src/packages/database';

async function main() {
  const trends = await prisma.trend.findMany({
    take: 10,
    orderBy: [{ isSaved: 'desc' }, { score: 'desc' }],
    include: { evidences: true }
  });

  console.log(`\n=== 10 CANONICAL EMERGING TRENDS IN DATABASE ===\n`);
  for (const t of trends) {
    console.log(`[Score: ${t.score.toFixed(1)}/10 | Conf: ${((t.confidence || 0.8) * 100).toFixed(0)}%] ${t.title}`);
    console.log(`  Category: ${t.category} | Saved: ${t.isSaved ? 'YES' : 'NO'} | Evidence count: ${t.evidences.length}`);
    console.log(`  7-Factor Scores: [DevRel: ${t.relevanceScore?.toFixed(1) ?? '-'}, Vel: ${t.velocityScore?.toFixed(1) ?? '-'}, Nov: ${t.noveltyScore?.toFixed(1) ?? '-'}, Auth: ${t.sourceAuthorityScore?.toFixed(1) ?? '-'}, Cross: ${t.crossSourceScore?.toFixed(1) ?? '-'}, Tech: ${t.technicalDepthScore?.toFixed(1) ?? '-'}, Cont: ${t.contentPotentialScore?.toFixed(1) ?? '-'}]`);
    if (t.whatChanged) console.log(`  Delta: ${t.whatChanged}`);
    if (t.recommendedAngle) console.log(`  Angle: ${t.recommendedAngle}`);
    console.log('');
  }
}

main().catch(console.error);
