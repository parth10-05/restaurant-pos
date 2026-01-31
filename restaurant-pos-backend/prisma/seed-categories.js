import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCategories() {
  const categories = [
    { name: 'Starters', sequence: 1 },
    { name: 'Main Course', sequence: 2 },
    { name: 'Desserts', sequence: 3 },
    { name: 'Beverages', sequence: 4 },
  ];

  console.log('Seeding default product categories...');

  for (const category of categories) {
    const exists = await prisma.productCategory.findUnique({
      where: { name: category.name },
    });

    if (!exists) {
      await prisma.productCategory.create({
        data: category,
      });
      console.log(`✓ Created category: ${category.name}`);
    } else {
      console.log(`- Category already exists: ${category.name}`);
    }
  }

  console.log('Category seeding completed.');
}

seedCategories()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });