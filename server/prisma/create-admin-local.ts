import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const prisma = new PrismaClient();

function generatePassword(): string {
  return randomBytes(9).toString('base64url');
}

function generateEmail(): string {
  return `admin@brixlore.test`;
}

async function main() {
  const password = generatePassword();
  const email = generateEmail();
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
