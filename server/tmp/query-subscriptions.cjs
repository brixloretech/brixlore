/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  const rows = await prisma.subscription.findMany({
    include: {
      plan: true,
      user: { select: { id: true, email: true, stripeCustomerId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  console.log(
    JSON.stringify(
      rows.map((row) => ({
        id: row.id,
        status: row.status,
        startDate: row.startDate,
        endDate: row.endDate,
        stripeSubscriptionId: row.stripeSubscriptionId,
        planId: row.planId,
        planName: row.plan?.name,
        userId: row.userId,
        email: row.user?.email,
        stripeCustomerId: row.user?.stripeCustomerId,
      })),
      null,
      2,
    ),
  );

  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
