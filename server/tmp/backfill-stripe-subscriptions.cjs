/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function computePeriodFromDuration(duration) {
  const startDate = new Date();
  const endDate = new Date(startDate);
  const normalized = String(duration).trim().toUpperCase();
  const numberMatch = normalized.match(/\d+/);
  const count = numberMatch ? Number(numberMatch[0]) : 1;

  if (normalized.includes('YEAR')) {
    endDate.setFullYear(endDate.getFullYear() + count);
  } else {
    endDate.setMonth(endDate.getMonth() + count);
  }

  return { startDate, endDate };
}

async function syncSubscriptionForUser(user) {
  const result = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: 'all',
    limit: 20,
  });

  let synced = 0;

  for (const stripeSub of result.data) {
    const isAccessGrantingStatus = stripeSub.status === 'active' || stripeSub.status === 'trialing';
    if (!isAccessGrantingStatus) {
      continue;
    }

    const metadata = { ...(stripeSub.metadata ?? {}), userId: user.id };

    let plan = null;
    if (metadata.planId) {
      plan = await prisma.plan.findUnique({ where: { id: metadata.planId } });
    }

    if (!plan) {
      const priceId = stripeSub.items?.data?.[0]?.price?.id;
      if (priceId) {
        plan = await prisma.plan.findFirst({ where: { stripePriceId: priceId } });
      }
    }

    if (!plan) {
      console.log(`Skipping ${stripeSub.id}: no matching plan`);
      continue;
    }

    const fullSubscription = await stripe.subscriptions.retrieve(stripeSub.id);
    const periodStart = fullSubscription.current_period_start
      ? new Date(fullSubscription.current_period_start * 1000)
      : null;
    const periodEnd = fullSubscription.current_period_end
      ? new Date(fullSubscription.current_period_end * 1000)
      : null;
    const hasValidPeriod =
      Boolean(periodStart && !Number.isNaN(periodStart.getTime())) &&
      Boolean(periodEnd && !Number.isNaN(periodEnd.getTime()));
    const fallbackPeriod = computePeriodFromDuration(plan.duration);
    const startDate = hasValidPeriod ? periodStart : fallbackPeriod.startDate;
    const endDate = hasValidPeriod ? periodEnd : fallbackPeriod.endDate;
    const status = 'ACTIVE';

    const existing = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSub.id },
    });

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          userId: user.id,
          planId: plan.id,
          status,
          startDate,
          endDate,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          stripeSubscriptionId: stripeSub.id,
          status,
          startDate,
          endDate,
        },
      });
    }

    synced += 1;
  }

  return synced;
}

(async () => {
  const users = await prisma.user.findMany({
    where: { stripeCustomerId: { not: null } },
    select: { id: true, email: true, stripeCustomerId: true },
  });

  const summary = [];
  for (const user of users) {
    const synced = await syncSubscriptionForUser(user);
    summary.push({ email: user.email, userId: user.id, synced });
  }

  console.log(JSON.stringify(summary, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
