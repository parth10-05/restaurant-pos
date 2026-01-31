import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Complete Database Seed - All Data
 * 
 * Seeds in order:
 * 1. Users (admin & cashier)
 * 2. POS Config
 * 3. Product Categories
 * 4. Products
 * 5. Floors
 * 6. Tables
 * 7. Transactions (sessions, orders, payments)
 */

// ============================================
// USERS
// ============================================
const usersData = [
  {
    email: 'admin@adani.com',
    password: 'admin123', // Will be hashed
    role: 'admin',
  },
  {
    email: 'cashier@adani.com',
    password: 'cashier123', // Will be hashed
    role: 'cashier',
  },
];

// ============================================
// POS CONFIG
// ============================================
const posConfigData = {
  posName: 'Adani Restaurant POS',
  defaultTax: 5.0,
  enableKitchenDisplay: true,
  enableCustomerDisplay: false,
  enableCash: true,
  enableDigital: true,
  enableUpi: true,
  upiId: 'adani@paytm',
};

// ============================================
// CATEGORIES
// ============================================
const categoriesData = [
  { name: 'Starters', sequence: 1 },
  { name: 'Main Course', sequence: 2 },
  { name: 'Desserts', sequence: 3 },
  { name: 'Beverages', sequence: 4 },
];

// ============================================
// PRODUCTS
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
// FLOORS
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

async function seedUsers() {
  console.log('👤 Seeding Users...');
  let created = 0;
  
  for (const userData of usersData) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    
    if (!existing) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
      created++;
      console.log(`   ✓ Created ${userData.role}: ${userData.email}`);
    }
  }
  
  if (created === 0) {
    console.log('   - Users already exist');
  }
  console.log('');
}

async function seedPosConfig() {
  console.log('⚙️  Seeding POS Config...');
  
  const existing = await prisma.posConfig.findFirst();
  
  if (!existing) {
    await prisma.posConfig.create({ data: posConfigData });
    console.log('   ✓ POS config created');
  } else {
    console.log('   - POS config already exists');
  }
  console.log('');
}

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

async function seedTransactions() {
  console.log('💳 Seeding Transaction Data...');
  
  const adminUser = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  const tables = await prisma.table.findMany({
    where: { active: true },
  });

  if (!adminUser || products.length === 0 || tables.length === 0) {
    console.log('   ⚠️  Skipping transactions - missing required data\n');
    return;
  }

  // Helper functions
  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomDateWithinDays = (days) => {
    const now = Date.now();
    const daysAgo = now - (days * 24 * 60 * 60 * 1000);
    return new Date(daysAgo + Math.random() * (now - daysAgo));
  };
  const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);
  const addMinutes = (date, mins) => new Date(date.getTime() + mins * 60 * 1000);

  const paymentMethods = ['cash', 'digital', 'upi'];
  
  let totalOrders = 0;
  let totalRevenue = 0;

  // Create 15 sessions
  for (let i = 0; i < 15; i++) {
    const sessionDate = randomDateWithinDays(30);
    sessionDate.setHours(10 + randomInt(0, 4), randomInt(0, 59), 0, 0);

    const openedAt = sessionDate;
    const closedAt = addHours(openedAt, randomInt(6, 10));

    const session = await prisma.pOS_Session.create({
      data: {
        openedBy: adminUser.id,
        openedAt,
        closedAt,
        status: 'closed',
        closingTotal: 0,
      },
    });

    let sessionRevenue = 0;
    const ordersInSession = randomInt(8, 15);

    for (let j = 0; j < ordersInSession; j++) {
      const orderTime = new Date(
        openedAt.getTime() + Math.random() * (closedAt.getTime() - openedAt.getTime())
      );

      const table = randomChoice(tables);

      const order = await prisma.order.create({
        data: {
          sessionId: session.id,
          userId: adminUser.id,
          tableId: table.id,
          status: 'paid',
          createdAt: orderTime,
          updatedAt: addMinutes(orderTime, randomInt(15, 45)),
          total: 0,
        },
      });

      const itemCount = randomInt(2, 6);
      const selectedProducts = [];
      
      for (let k = 0; k < itemCount; k++) {
        const product = randomChoice(products);
        const qty = randomInt(1, 3);
        const taxAmount = (product.price * qty * product.taxPercent) / 100;

        selectedProducts.push({
          orderId: order.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          qty,
          taxAmount,
        });
      }

      await prisma.orderLine.createMany({ data: selectedProducts });

      const orderTotal = selectedProducts.reduce((sum, item) => {
        return sum + (item.price * item.qty) + item.taxAmount;
      }, 0);

      await prisma.order.update({
        where: { id: order.id },
        data: { total: orderTotal },
      });

      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: orderTotal,
          method: randomChoice(paymentMethods),
          createdAt: addMinutes(orderTime, randomInt(15, 45)),
        },
      });

      sessionRevenue += orderTotal;
      totalOrders++;
      totalRevenue += orderTotal;
    }

    await prisma.pOS_Session.update({
      where: { id: session.id },
      data: { closingTotal: sessionRevenue },
    });
  }

  console.log(`   ✓ Created 15 sessions with ${totalOrders} orders`);
  console.log(`   ✓ Total revenue: ₹${totalRevenue.toFixed(2)}\n`);
}

// ============================================
// MAIN SEED
// ============================================

async function seedAll() {
  console.log('🌱 Starting Complete Database Seed...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    await seedUsers();
    await seedPosConfig();
    await seedCategories();
    await seedProducts();
    await seedFloorsAndTables();
    await seedTransactions();

    // Final summary
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.productCategory.count(),
      products: await prisma.product.count(),
      floors: await prisma.floor.count(),
      tables: await prisma.table.count(),
      sessions: await prisma.pOS_Session.count(),
      orders: await prisma.order.count({ where: { status: 'paid' } }),
    };

    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Complete Seed Successful!\n');
    console.log('📊 Database Summary:');
    console.log(`   Users: ${counts.users}`);
    console.log(`   Categories: ${counts.categories}`);
    console.log(`   Products: ${counts.products}`);
    console.log(`   Floors: ${counts.floors}`);
    console.log(`   Tables: ${counts.tables}`);
    console.log(`   Sessions: ${counts.sessions}`);
    console.log(`   Orders: ${counts.orders}`);
    console.log(`   Total Revenue: ₹${(totalRevenue._sum.amount || 0).toFixed(2)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

seedAll()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });