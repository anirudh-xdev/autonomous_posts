import { prisma } from '@/packages/database';

async function main() {
  const seedUrls = [
    'https://techcrunch.com/2024/11/cursor-ai-coding-agents-growth',
    'https://openai.com/index/introducing-responses-api',
    'https://deepmind.google/technologies/gemma',
    'https://simonwillison.net/2024/Nov/25/model-context-protocol',
    'https://github.com/karpathy/llm.c',
    'https://anthropic.com/news/mcp-standard',
    'https://github.com/browser-use/browser-use'
  ];

  const trendsToDelete = await prisma.trend.findMany({
    where: {
      evidences: {
        some: {
          sourceUrl: { in: seedUrls }
        }
      }
    },
    select: { id: true, title: true }
  });

  console.log(`Found ${trendsToDelete.length} legacy fixture trends to purge:`);
  for (const t of trendsToDelete) {
    console.log(`- ${t.title}`);
  }

  const ids = trendsToDelete.map(t => t.id);

  if (ids.length > 0) {
    await prisma.publication.deleteMany({
      where: {
        contentVariant: { contentItem: { trendId: { in: ids } } }
      }
    });

    await prisma.qualityCheck.deleteMany({
      where: {
        contentVariant: { contentItem: { trendId: { in: ids } } }
      }
    });

    await prisma.contentVariant.deleteMany({
      where: {
        contentItem: { trendId: { in: ids } }
      }
    });

    await prisma.contentItem.deleteMany({
      where: { trendId: { in: ids } }
    });

    await prisma.researchReport.deleteMany({
      where: { trendId: { in: ids } }
    });

    await prisma.trendEvidence.deleteMany({
      where: { trendId: { in: ids } }
    });

    await prisma.trend.deleteMany({
      where: { id: { in: ids } }
    });

    console.log(`✅ Successfully purged ${ids.length} fixture trends.`);
  }

  const remaining = await prisma.trend.findMany({ select: { id: true, title: true, status: true } });
  console.log(`\nRemaining purely live trends (${remaining.length}):`);
  for (const r of remaining) {
    console.log(`- [${r.status}] ${r.title}`);
  }
}

main().finally(() => prisma.$disconnect());
