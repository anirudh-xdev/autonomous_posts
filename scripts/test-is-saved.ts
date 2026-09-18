import { prisma } from '@/packages/database';

async function test() {
  const t = await prisma.trend.findFirst();
  console.log('Trend isSaved:', (t as any)?.isSaved);
}

test().finally(() => prisma.$disconnect());
