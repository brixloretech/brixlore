import dotenv from 'dotenv';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  const users = await prisma.user.findMany({
    where: { stripeCustomerId: { not: null } },
    select: { id: true, email: true, stripeCustomerId: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const results = [];
  for (const user of users) {
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'all',
      limit: 10,
    });
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 10,
    });

    results.push({
      user,
      subscriptions: subscriptions.data.map((sub) => ({
        id: sub.id,
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        metadata: sub.metadata,
        priceIds: sub.items.data.map((item) => item.price?.id).filter(Boolean),
        created: sub.created,
      })),
      invoices: invoices.data.map((invoice) => ({
        id: invoice.id,
        status: invoice.status,
        amount_paid: invoice.amount_paid,
        amount_due: invoice.amount_due,
        created: invoice.created,
        subscription: invoice.subscription,
      })),
    });
  }

  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
