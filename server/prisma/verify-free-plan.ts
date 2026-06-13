import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const freePlan = await prisma.plan.findFirst({
    where: { name: 'Free Account' },
  });

  if (!freePlan) {
    console.error('❌ Free Account plan not found!');
    return;
  }
  
  console.log('✅ Free Account plan exists with ID:', freePlan.id);
  console.log('✅ Plan details:', { price: freePlan.price, deviceLimit: freePlan.deviceLimit });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
