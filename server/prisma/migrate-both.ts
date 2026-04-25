/**
 * Run Prisma migrations against both production (.env) and development (.env.local) databases.
 * Usage: npx ts-node prisma/migrate-both.ts
 * Or: npm run db:migrate:both
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

const root = path.join(__dirname, '..');

function runMigrate(envLabel: string, envPath: string) {
  const resolved = path.resolve(root, envPath);
  console.log(`\n[${envLabel}] Loading ${envPath} and running migrate deploy...`);
  dotenv.config({ path: resolved, override: true });
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(`[${envLabel}] DATABASE_URL not found in ${envPath}. Skipping.`);
    return;
  }
  try {
    execSync('npx prisma migrate deploy --schema=prisma/schema.prisma', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
      cwd: root,
    });
    console.log(`[${envLabel}] Migrations applied successfully.`);
  } catch (err) {
    console.error(`[${envLabel}] Migrate deploy failed:`, err);
    throw err;
  }
}

// 1) Production – .env
runMigrate('Production (.env)', '.env');

// 2) Development – .env.local
runMigrate('Development (.env.local)', '.env.local');

console.log('\nDone. Both databases are up to date.');
