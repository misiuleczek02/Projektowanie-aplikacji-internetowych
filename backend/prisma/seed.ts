import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seedowanie bazy...');

  const categories = [
    { name: 'Zdrowie', color: '#10b981' },
    { name: 'Nauka', color: '#3b82f6' },
    { name: 'Produktywność', color: '#f59e0b' },
    { name: 'Sport', color: '#ef4444' },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', password: passwordHash },
  });

  const zdrowie = await prisma.category.findUnique({ where: { name: 'Zdrowie' } });
  const nauka = await prisma.category.findUnique({ where: { name: 'Nauka' } });

  // Idempotentnie: tworzymy przykładowe nawyki tylko gdy demo user ich nie ma,
  // dzięki czemu seed można bezpiecznie uruchamiać przy każdym starcie kontenera.
  const existingHabits = await prisma.habit.count({ where: { userId: demoUser.id } });

  if (zdrowie && nauka && existingHabits === 0) {
    await prisma.habit.create({
      data: {
        name: 'Wypij 2L wody',
        description: 'Nawodnienie przez cały dzień',
        userId: demoUser.id,
        categoryId: zdrowie.id,
      },
    });
    await prisma.habit.create({
      data: {
        name: 'Czytaj 30 minut',
        description: 'Codzienne czytanie',
        userId: demoUser.id,
        categoryId: nauka.id,
      },
    });
  }

  console.log('Gotowe. Konto demo: demo@example.com / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
