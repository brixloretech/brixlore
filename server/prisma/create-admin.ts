import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generatePassword(): string {
  return randomBytes(9).toString('base64url');
}

async function main() {
  const password = generatePassword();
  const email = `admin@brixlore.test`;
  const name = 'Admin';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      name,
      role: 'admin',
      passwordHash,
    },
  });

  console.log(`ADMIN_EMAIL=${email}`);
  console.log(`ADMIN_PASSWORD=${password}`);
  //sNWpSD9ec7tP
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
