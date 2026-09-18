import { prisma } from '@/packages/database';

async function main() {
  const allTrends = await prisma.trend.findMany({
    include: { evidences: true }
  });
  console.log(`Total trends in dev.db: ${allTrends.length}`);
  
  const mockCandidates = allTrends.filter(t => 
    t.title.toLowerCase().includes('mock') || 
    t.evidences.some(e => e.sourceUrl.includes('mock') || e.sourceUrl.includes('1861000000000000000'))
  );
  console.log(`Trends with 'mock' in title or url: ${mockCandidates.length}`);

  const mockPubs = await prisma.publication.findMany({
    where: {
      OR: [
        { platformPostId: { contains: 'mock' } },
        { postUrl: { contains: 'mock' } },
      ]
    }
  });
  console.log(`Mock publications in dev.db: ${mockPubs.length}`);

  const mockVariants = await prisma.contentVariant.findMany({
    where: { model: 'mock' }
  });
  console.log(`Mock content variants in dev.db: ${mockVariants.length}`);
}

main().finally(() => prisma.$disconnect());
