/**
 * Idempotent startup seed — runs on every deploy via startCommand.
 * Only creates data if it doesn't already exist (safe to run repeatedly).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin user — upsert so repeated deploys are safe
  const existing = await prisma.user.findUnique({ where: { email: 'admin@hungyilee.com' } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('Admin1234!', 10);
    await prisma.user.create({
      data: { email: 'admin@hungyilee.com', passwordHash, name: '李泓毅' },
    });
    console.log('✅ Admin user seeded');
  } else {
    console.log('ℹ️  Admin user already exists, skipping seed');
  }

  // Site settings — create only if missing
  const settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    await prisma.siteSettings.create({
      data: {
        metaTitle: '李泓毅 | 資深產品經理 Portfolio',
        metaDesc: '李泓毅的個人作品集，專注企業數位轉型與 AI 產品開發。',
        notifyEmail: 'admin@hungyilee.com',
        notifyOnMessage: true,
      },
    });
    console.log('✅ Site settings seeded');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
