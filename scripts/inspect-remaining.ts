import { prisma } from '@/packages/database';

async function main() {
  const trends = await prisma.trend.findMany({
    include: { evidences: true },
  });

  console.log(`\n=== REMAINING ${trends.length} TRENDS ===`);
  for (const t of trends) {
    console.log(`- [${t.status}] "${t.title}"`);
    for (const e of t.evidences) {
      console.log(`    -> Source: [${e.sourceName}] ${e.sourceUrl}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
