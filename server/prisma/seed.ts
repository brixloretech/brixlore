import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const planCount = await prisma.plan.count();
  if (planCount === 0) {
    await prisma.plan.createMany({
      data: [
        {
          name: 'Fan',
          price: '4.99',
          duration: 'MONTHLY',
          deviceLimit: 1,
          offlineAllowed: false,
          maxOfflineDownloads: 0,
        },
        {
          name: 'Mega Fan',
          price: '9.99',
          duration: 'MONTHLY',
          deviceLimit: 4,
          offlineAllowed: true,
          maxOfflineDownloads: 10,
        },
        {
          name: 'Ultimate',
          price: '14.99',
          duration: 'MONTHLY',
          deviceLimit: 6,
          offlineAllowed: true,
          maxOfflineDownloads: 25,
        },
      ],
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
