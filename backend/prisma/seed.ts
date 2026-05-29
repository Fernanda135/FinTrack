import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { label: 'Alimentação', value: 'alimentacao', isIncome: false },
  { label: 'Transporte', value: 'transporte', isIncome: false },
  { label: 'Moradia', value: 'moradia', isIncome: false },
  { label: 'Assinaturas', value: 'assinaturas', isIncome: false },
  { label: 'Renda', value: 'renda', isIncome: true },
  { label: 'Saúde', value: 'saude', isIncome: false },
  { label: 'Lazer', value: 'lazer', isIncome: false },
  { label: 'Educação', value: 'educacao', isIncome: false },
];

async function main() {
  const passwordHash = await argon2.hash('demo1234');
  const user = await prisma.user.upsert({
    where: { email: 'demo@fintrack.app' },
    update: {},
    create: { email: 'demo@fintrack.app', name: 'Fulano', passwordHash },
  });

  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_value: { userId: user.id, value: c.value } },
      update: {},
      create: { ...c, userId: user.id },
    });
  }
  console.log('Seeded user', user.email);
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
