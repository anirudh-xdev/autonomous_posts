import { prisma } from '@/packages/database';

async function main() {
  console.log('--- Inspecting Database Trends & Evidences ---');
  const trends = await prisma.trend.findMany({
    include: { evidences: true, contentItems: { include: { variants: true } } },
  });

  console.log(`Total trends in DB: ${trends.length}`);

  const mockEvidencesKeywords = [
    '1861000000000000000',
    'deepseek-v3-mla-benchmarks',
    'item?id=42234058',
    'item?id=42211029',
    'modelcontextprotocol/servers',
    'anthropic.com/news/model-context-protocol',
    'responses-api-python-sandbox',
  ];

  const trendsToDelete: string[] = [];

  for (const t of trends) {
    const hasMockEvidence = t.evidences.some((e) =>
      mockEvidencesKeywords.some((kw) => e.sourceUrl.includes(kw))
    );
    const hasNoEvidence = t.evidences.length === 0;

    if (hasMockEvidence || hasNoEvidence) {
      console.log(`[MOCK DETECTED] Trend ${t.id} - "${t.title}" (evidences: ${t.evidences.map(e => e.sourceUrl).join(', ')})`);
      trendsToDelete.push(t.id);
    } else {
      console.log(`[REAL] Trend ${t.id} - "${t.title}" (${t.evidences.length} evidences)`);
    }
  }

  // Also check for content variants created with model 'mock'
  const mockVariants = await prisma.contentVariant.findMany({
    where: { model: 'mock' },
    select: { id: true, contentItemId: true },
  });
  console.log(`Content variants with model 'mock': ${mockVariants.length}`);

  if (trendsToDelete.length > 0) {
    console.log(`\nPurging ${trendsToDelete.length} mock trends...`);

    // 1. Delete associated publications
    await prisma.publication.deleteMany({
      where: {
        contentVariant: {
          contentItem: { trendId: { in: trendsToDelete } },
        },
      },
    });

    // 2. Delete quality checks
    await prisma.qualityCheck.deleteMany({
      where: {
        contentVariant: {
          contentItem: { trendId: { in: trendsToDelete } },
        },
      },
    });

    // 3. Delete content variants
    await prisma.contentVariant.deleteMany({
      where: {
        contentItem: { trendId: { in: trendsToDelete } },
      },
    });

    // 4. Delete content items
    await prisma.contentItem.deleteMany({
      where: { trendId: { in: trendsToDelete } },
    });

    // 5. Delete research reports
    await prisma.researchReport.deleteMany({
      where: { trendId: { in: trendsToDelete } },
    });

    // 6. Delete evidences
    await prisma.trendEvidence.deleteMany({
      where: { trendId: { in: trendsToDelete } },
    });

    // 7. Delete trends
    const res = await prisma.trend.deleteMany({
      where: { id: { in: trendsToDelete } },
    });
    console.log(`✅ Deleted ${res.count} mock trends.`);
  }

  // Also delete any remaining variants with model === 'mock'
  if (mockVariants.length > 0) {
    await prisma.qualityCheck.deleteMany({
      where: { contentVariantId: { in: mockVariants.map((v) => v.id) } },
    });
    await prisma.publication.deleteMany({
      where: { contentVariantId: { in: mockVariants.map((v) => v.id) } },
    });
    await prisma.contentVariant.deleteMany({
      where: { id: { in: mockVariants.map((v) => v.id) } },
    });
    console.log(`✅ Deleted ${mockVariants.length} mock variants.`);
  }

  const remainingTrends = await prisma.trend.count();
  const remainingVariants = await prisma.contentVariant.count();
  console.log(`\nFinal state in dev.db:`);
  console.log(`- Trends remaining: ${remainingTrends} (all live, original)`);
  console.log(`- Variants remaining: ${remainingVariants}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
