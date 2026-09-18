import { prisma } from '@/packages/database';

async function main() {
  const check = await prisma.qualityCheck.findFirst({
    where: { contentVariantId: 'a07e8dc4-a4a9-436c-95e7-9ffdf25e6033' }
  });
  console.log('Feedback:', check?.feedback);
  console.log('Checks:', check?.checks);
}

main().finally(() => prisma.$disconnect());
