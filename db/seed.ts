import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import sampleData from './sample-data';
import { hash } from '@/lib/encrypt';

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
      password: await hash(plain),
    });
  }
  await prisma.user.createMany({ data: users });

  console.log('Database seeded successfully!');
}

main();
