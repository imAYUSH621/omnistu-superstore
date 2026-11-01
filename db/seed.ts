import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import sampleData from './sample-data';
import { hashPassword } from '@/lib/password';
import { seedAllowed } from '@/lib/catalog-import';

// Seed users no longer carry the hardcoded weak password '123456'.
// Passwords come from SEED_ADMIN_PASSWORD / SEED_USER_PASSWORD, or a random
// one-time value is generated and printed once to the console (never logged
// alongside its hash, and never weak).
function seedPassword(envVar: 'SEED_ADMIN_PASSWORD' | 'SEED_USER_PASSWORD', label: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv && fromEnv.length >= 12) return fromEnv;
  if (fromEnv) {
    console.warn(`[seed] ${envVar} is shorter than 12 chars - ignoring it`);
  }
  const generated = randomBytes(12).toString('base64url');
  console.log(`[seed] generated ${label} password (save it now, shown once): ${generated}`);
  return generated;
}

async function main() {
  // This script DELETES products, users, sessions and accounts first. Refuse on
  // anything that is not a local database. For an existing catalog use
  // scripts/import-catalog.ts (additive, dry-run by default).
  const gate = seedAllowed(process.env.DATABASE_URL, process.env);
  if (!gate.ok) {
    console.error(`[seed] refused: ${gate.reason}. This script deletes data. Use scripts/import-catalog.ts, or set ALLOW_DESTRUCTIVE_SEED=1 on a throwaway database.`);
    process.exit(1);
  }
  const prisma = new PrismaClient();
  await prisma.product.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  await prisma.product.createMany({ data: sampleData.products });
  const users = [];
  for (let i = 0; i < sampleData.users.length; i++) {
    const u = sampleData.users[i];
    const isAdmin = u.role === 'admin';
    const plain = seedPassword(isAdmin ? 'SEED_ADMIN_PASSWORD' : 'SEED_USER_PASSWORD', u.email);
    users.push({
      ...u,
      password: await hashPassword(plain),
    });
  }
  await prisma.user.createMany({ data: users });

  console.log('Database seeded successfully!');
}

main();
