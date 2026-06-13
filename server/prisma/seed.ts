import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Define the new plans details
  const newPlans = [
    {
      oldName: 'Free',
      name: 'Free Account',
      price: '0.00',
      yearlyPrice: '0.00',
      duration: 'MONTHLY',
      deviceLimit: 1,
      offlineAllowed: false,
      maxOfflineDownloads: 0,
      perks: ['Ad-supported streaming', '1 device logged in at once', 'Upgrade anytime'],
      isPopular: false,
    },
    {
      oldName: 'Fan',
      name: 'Lore Member',
      price: '4.99',
      yearlyPrice: '49.99',
      duration: 'MONTHLY',
      deviceLimit: 1,
      offlineAllowed: false,
      maxOfflineDownloads: 0,
      perks: ['Ad-free streaming', '1 device logged in at once', 'Cancel anytime'],
      isPopular: false,
    },
    {
      oldName: 'Mega Fan',
      name: 'Brixlore Collective',
      price: '9.99',
      yearlyPrice: '99.99',
      duration: 'MONTHLY',
      deviceLimit: 3,
      offlineAllowed: true,
      maxOfflineDownloads: 15,
      perks: [
        'Ad-free streaming',
        'Up to 3 devices logged in at once',
        'Offline downloads allowed',
        'Early access & exclusive content',
      ],
      isPopular: true,
    },
    {
      oldName: 'Ultimate',
      name: 'Lorekeeper Elite',
      price: '14.99',
      yearlyPrice: '149.99',
      duration: 'MONTHLY',
      deviceLimit: 5,
      offlineAllowed: true,
      maxOfflineDownloads: 30,
      perks: [
        'Ad-free streaming',
        'Up to 5 devices logged in at once',
        'Offline downloads allowed',
        'Priority support & events',
        'All perks included',
      ],
      isPopular: false,
    },
  ];

  for (const planData of newPlans) {
    // Try to find the plan by its new name or old name
    const existingPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { name: planData.name },
          { name: planData.oldName },
        ],
      },
    });

    if (existingPlan) {
      console.log(`Updating existing plan: "${existingPlan.name}" -> "${planData.name}"`);
      await prisma.plan.update({
        where: { id: existingPlan.id },
        data: {
          name: planData.name,
          price: planData.price,
          yearlyPrice: planData.yearlyPrice,
          duration: planData.duration,
          deviceLimit: planData.deviceLimit,
          offlineAllowed: planData.offlineAllowed,
          maxOfflineDownloads: planData.maxOfflineDownloads,
          perks: planData.perks,
          isPopular: planData.isPopular,
        },
      });
    } else {
      console.log(`Creating new plan: "${planData.name}"`);
      await prisma.plan.create({
        data: {
          name: planData.name,
          price: planData.price,
          yearlyPrice: planData.yearlyPrice,
          duration: planData.duration,
          deviceLimit: planData.deviceLimit,
          offlineAllowed: planData.offlineAllowed,
          maxOfflineDownloads: planData.maxOfflineDownloads,
          perks: planData.perks,
          isPopular: planData.isPopular,
        },
      });
    }
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
