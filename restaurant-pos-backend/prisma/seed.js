import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create tables
  const tables = await Promise.all([
    prisma.table.upsert({
      where: { number: 1 },
      update: {},
      create: { number: 1, capacity: 4 },
    }),
    prisma.table.upsert({
      where: { number: 2 },
      update: {},
      create: { number: 2, capacity: 4 },
    }),
    prisma.table.upsert({
      where: { number: 3 },
      update: {},
      create: { number: 3, capacity: 6 },
    }),
    prisma.table.upsert({
      where: { number: 4 },
      update: {},
      create: { number: 4, capacity: 2 },
    }),
  ]);

  console.log(`✅ Created ${tables.length} tables`);

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 1 },
      update: {},
      create: { name: 'Burger', description: 'Classic beef burger', price: 199.0 },
    }),
    prisma.product.upsert({
      where: { id: 2 },
      update: {},
      create: { name: 'Pizza', description: 'Margherita pizza', price: 299.0 },
    }),
    prisma.product.upsert({
      where: { id: 3 },
      update: {},
      create: { name: 'Pasta', description: 'Creamy alfredo pasta', price: 249.0 },
    }),
    prisma.product.upsert({
      where: { id: 4 },
      update: {},
      create: { name: 'Coke', description: 'Coca-Cola 300ml', price: 49.0 },
    }),
    prisma.product.upsert({
      where: { id: 5 },
      update: {},
      create: { name: 'French Fries', description: 'Crispy golden fries', price: 99.0 },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });