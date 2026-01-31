import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Complete Database Seed
 * Seeds all required data for production-ready POS system
 */

// ============================================
// CATEGORIES DATA
// ============================================
const categoriesData = [
  { name: 'Starters', sequence: 1 },
  { name: 'Main Course', sequence: 2 },
  { name: 'Desserts', sequence: 3 },
  { name: 'Beverages', sequence: 4 },
];

// ============================================
// PRODUCTS DATA
// ============================================
const productsData = {
  'Starters': [
    { name: 'Paneer Tikka', description: 'Grilled cottage cheese marinated in Indian spices', price: 280.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Chicken 65', description: 'Spicy deep-fried chicken chunks with curry leaves', price: 320.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Vegetable Spring Rolls', description: 'Crispy rolls filled with mixed vegetables', price: 220.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Fish Finger', description: 'Crispy breaded fish strips with tartar sauce', price: 340.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Mushroom Soup', description: 'Creamy soup with fresh mushrooms and herbs', price: 180.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Corn Cheese Balls', description: 'Deep-fried corn and cheese croquettes', price: 240.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Chicken Wings', description: 'Spicy buffalo wings with ranch dip', price: 360.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Veg Manchurian', description: 'Indo-Chinese vegetable balls in tangy sauce', price: 260.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
  ],
  'Main Course': [
    { name: 'Butter Chicken', description: 'Tender chicken in rich tomato and butter gravy', price: 420.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Paneer Butter Masala', description: 'Cottage cheese cubes in creamy tomato gravy', price: 380.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Chicken Biryani', description: 'Aromatic basmati rice with spiced chicken', price: 450.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Veg Biryani', description: 'Fragrant rice with mixed vegetables and spices', price: 350.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Dal Makhani', description: 'Creamy black lentils slow-cooked overnight', price: 280.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Kadai Paneer', description: 'Cottage cheese with bell peppers in spicy gravy', price: 360.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Fish Curry', description: 'Fresh fish cooked in coastal-style curry', price: 480.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Mutton Rogan Josh', description: 'Tender mutton in aromatic Kashmiri gravy', price: 520.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Veg Hakka Noodles', description: 'Stir-fried noodles with vegetables', price: 280.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Chicken Fried Rice', description: 'Wok-tossed rice with chicken and vegetables', price: 320.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Palak Paneer', description: 'Cottage cheese in spinach gravy', price: 340.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Chicken Tandoori', description: 'Clay oven roasted chicken with spices', price: 440.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Naan Bread', description: 'Freshly baked leavened bread', price: 50.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Garlic Naan', description: 'Naan topped with butter and garlic', price: 70.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Butter Naan', description: 'Naan brushed with melted butter', price: 60.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
  ],
  'Desserts': [
    { name: 'Gulab Jamun', description: 'Fried milk dumplings in sugar syrup (2 pcs)', price: 120.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Chocolate Brownie', description: 'Warm chocolate brownie with vanilla ice cream', price: 180.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Rasmalai', description: 'Cottage cheese patties in sweetened milk (2 pcs)', price: 140.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Ice Cream Sundae', description: 'Triple scoop ice cream with chocolate sauce', price: 160.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Tiramisu', description: 'Classic Italian coffee-flavored dessert', price: 220.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Kulfi', description: 'Traditional Indian ice cream (Mango/Pistachio)', price: 100.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Cheesecake', description: 'New York style cheesecake with berry compote', price: 240.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
    { name: 'Gajar Halwa', description: 'Carrot pudding with nuts and cardamom', price: 130.00, taxPercent: 5.0, isActive: true, sendToKitchen: true },
  ],
  'Beverages': [
    { name: 'Fresh Lime Soda', description: 'Refreshing lime juice with soda water', price: 80.00, taxPercent: 5.0, isActive: true, sendToKitchen: false },
    { name: 'Mango Lassi', description: 'Chilled yogurt drink with mango pulp', price: 120.00, taxPercent: 5.0, isActive: true, sendToKitchen: false },
    { name: 'Masala Chai', description: 'Traditional Indian spiced tea', price: 60.00, taxPercent: 5.0, isActive: true, sendToKitchen: false },
    { name: 'Coffee', description: 'Freshly brewed filter coffee', price: 80.00, taxPercent: 5.0, isActive: true, sendToKitchen: false },
    { name: 'Coca Cola', description: 'Chilled soft drink (300ml)', price: 60.00, taxPercent: 12.0, isActive: true, sendToKitchen: false },
    { name: 'Mineral Water', description: 'Packaged drinking water (1L)', price: 40.00, taxPercent: 18.0, isActive: true, sendToKitchen: false },
    { name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice', price: 140.00, taxPercent: 5.0, isActive: true, sendToKitchen: false },
    { name: 'Sweet Lassi', description: 'Traditional sweetened yogurt drink', price: 100.00, taxPercent: 5.0, isActive: true, sendToKitchen: false },
    { name: 'Iced Tea', description: 'Chilled lemon iced tea', price: 90.00, taxPercent: 5.0, isActive: true, sendToKitchen: false },
    { name: 'Mojito (Virgin)', description: 'Non-alcoholic mint and lime mocktail', price: 150.00, taxPercent: 5.0, isActive: true, sendToKitchen: false },
    { name: 'Hot Chocolate', description: 'Rich hot chocolate with whipped cream', price: 120.00, taxPercent: 5.0, isActive: true, sendToKitchen: false },
    { name: 'Green Tea', description: 'Premium green tea', price: 70.00, taxPercent: 5.0, isActive: true, sendToKitchen: false },
  ],
};

// ============================================
// FLOORS DATA
// ============================================
const floorsData = [
  {
    name: 'Ground Floor',
    sequence: 1,
    active: true,
    tables: [
      { number: 1, seats: 2 }, { number: 2, seats: 2 }, { number: 3, seats: 4 },
      { number: 4, seats: 4 }, { number: 5, seats: 4 }, { number: 6, seats: 4 },
      { number: 7, seats: 6 }, { number: 8, seats: 6 }, { number: 9, seats: 2 },
      { number: 10, seats: 2 }, { number: 11, seats: 4 }, { number: 12, seats: 4 },
      { number: 13, seats: 8 }, { number: 14, seats: 4 }, { number: 15, seats: 4 },
    ],
  },
  {
    name: 'First Floor',
    sequence: 2,
    active: true,
    tables: [
      { number: 16, seats: 6 }, { number: 17, seats: 6 }, { number: 18, seats: 8 },
      { number: 19, seats: 4 }, { number: 20, seats: 4 }, { number: 21, seats: 4 },
      { number: 22, seats: 6 }, { number: 23, seats: 2 }, { number: 24, seats: 2 },
      { number: 25, seats: 10 },
    ],
  },
  {
    name: 'Rooftop',
    sequence: 3,
    active: true,
    tables: [
      { number: 26, seats: 4 }, { number: 27, seats: 4 }, { number: 28, seats: 6 },
      { number: 29, seats: 8 }, { number: 30, seats: 2 },
    ],
  },
  {
    name: 'Garden Area',
    sequence: 4,
    active: true,
    tables: [
      { number: 31, seats: 4 }, { number: 32, seats: 4 }, { number: 33, seats: 6 },
      { number: 34, seats: 6 }, { number: 35, seats: 2 }, { number: 36, seats: 2 },
      { number: 37, seats: 8 }, { number: 38, seats: 4 },
    ],
  },
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedCategories() {
  console.log('📂 Seeding Categories...');
  let created = 0;
  for (const category of categoriesData) {
    const existing = await prisma.productCategory.findUnique({
      where: { name: category.name },
    });
    if (!existing) {
      await prisma.productCategory.create({ data: category });
      created++;
    }
  }
  console.log(`   ✓ Created ${created} categories\n`);
}

async function seedProducts() {
  console.log('📦 Seeding Products...');
  const categories = await prisma.productCategory.findMany();
  let totalCreated = 0;

  for (const category of categories) {
    const products = productsData[category.name];
    if (!products) continue;

    for (const product of products) {
      const existing = await prisma.product.findFirst({
        where: { name: product.name, categoryId: category.id },
      });
      if (!existing) {
        await prisma.product.create({
          data: { ...product, categoryId: category.id },
        });
        totalCreated++;
      }
    }
  }
  console.log(`   ✓ Created ${totalCreated} products\n`);
}

async function seedFloorsAndTables() {
  console.log('🏢 Seeding Floors & Tables...');
  let floorsCreated = 0;
  let tablesCreated = 0;

  for (const floorData of floorsData) {
    let floor = await prisma.floor.findFirst({
      where: { name: floorData.name },
    });

    if (!floor) {
      floor = await prisma.floor.create({
        data: {
          name: floorData.name,
          sequence: floorData.sequence,
          active: floorData.active,
        },
      });
      floorsCreated++;
    }

    for (const tableData of floorData.tables) {
      const existing = await prisma.table.findUnique({
        where: {
          floorId_number: {
            floorId: floor.id,
            number: tableData.number,
          },
        },
      });
      if (!existing) {
        await prisma.table.create({
          data: {
            number: tableData.number,
            seats: tableData.seats,
            floorId: floor.id,
            active: true,
          },
        });
        tablesCreated++;
      }
    }
  }
  console.log(`   ✓ Created ${floorsCreated} floors`);
  console.log(`   ✓ Created ${tablesCreated} tables\n`);
}

// ============================================
// MAIN SEED
// ============================================

async function seedComplete() {
  console.log('🌱 Starting Complete Database Seed...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    await seedCategories();
    await seedProducts();
    await seedFloorsAndTables();

    // Summary
    const categoryCount = await prisma.productCategory.count();
    const productCount = await prisma.product.count();
    const floorCount = await prisma.floor.count();
    const tableCount = await prisma.table.count();

    const tables = await prisma.table.findMany();
    const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database Seed Completed Successfully!\n');
    console.log('📊 Final Summary:');
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Products: ${productCount}`);
    console.log(`   Floors: ${floorCount}`);
    console.log(`   Tables: ${tableCount}`);
    console.log(`   Total Seating Capacity: ${totalSeats} seats`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

seedComplete()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });