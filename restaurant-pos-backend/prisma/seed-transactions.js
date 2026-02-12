import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Transaction Data Seed
 * 
 * PURPOSE:
 * Generate realistic POS transaction data for testing reports module
 * 
 * GENERATES:
 * - Multiple POS sessions (last 30 days)
 * - Paid orders with realistic order lines
 * - Payment records (cash, digital, UPI)
 * - Kitchen tickets
 * - Varied order sizes and timings
 * 
 * DATA VOLUME:
 * - 15-20 sessions
 * - 150-200 orders
 * - 400-600 order lines
 * - Mix of payment methods
 */

// Helper: Random element from array
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: Random integer between min and max (inclusive)
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: Random date within last N days
const randomDateWithinDays = (days) => {
  const now = Date.now();
  const daysAgo = now - (days * 24 * 60 * 60 * 1000);
  const randomTime = daysAgo + Math.random() * (now - daysAgo);
  return new Date(randomTime);
};

// Helper: Add hours to date
const addHours = (date, hours) => {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  return newDate;
};

// Helper: Add minutes to date
const addMinutes = (date, minutes) => {
  const newDate = new Date(date);
  newDate.setMinutes(newDate.getMinutes() + minutes);
  return newDate;
};

async function seedTransactions() {
  console.log('💳 Starting transaction data seed...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Get admin user (create if doesn't exist)
    let adminUser = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (!adminUser) {
      console.log('⚠️  No admin user found. Creating one...');
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@restaurant.com',
          password: '$2b$10$xyz...', // Hashed password
          role: 'admin',
        },
      });
      console.log('✓ Admin user created\n');
    }

    // Get all products and tables
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    });

    const tables = await prisma.table.findMany({
      where: { active: true },
    });

    if (products.length === 0) {
      console.log('❌ No products found. Please run seed-complete.js first.');
      return;
    }

    if (tables.length === 0) {
      console.log('❌ No tables found. Please run seed-complete.js first.');
      return;
    }

    console.log(`📦 Found ${products.length} products`);
    console.log(`🪑 Found ${tables.length} tables\n`);

    // Payment methods distribution
    const paymentMethods = [
      { method: 'cash', weight: 50 },      // 50%
      { method: 'digital', weight: 35 },   // 35%
      { method: 'upi', weight: 15 },       // 15%
    ];

    const getRandomPaymentMethod = () => {
      const random = Math.random() * 100;
      let cumulative = 0;
      for (const pm of paymentMethods) {
        cumulative += pm.weight;
        if (random <= cumulative) return pm.method;
      }
      return 'cash';
    };

    let totalSessions = 0;
    let totalOrders = 0;
    let totalRevenue = 0;

    // Generate sessions for last 30 days
    const sessionsToCreate = 18; // ~18 sessions in 30 days
    console.log(`🏪 Creating ${sessionsToCreate} POS sessions...\n`);

    for (let i = 0; i < sessionsToCreate; i++) {
      // Random date within last 30 days
      const sessionDate = randomDateWithinDays(30);
      
      // Set session to business hours (10 AM - 10 PM)
      sessionDate.setHours(10 + randomInt(0, 4), randomInt(0, 59), 0, 0);

      const openedAt = sessionDate;
      const closedAt = addHours(openedAt, randomInt(6, 10)); // 6-10 hour shifts

      console.log(`Session ${i + 1}: ${openedAt.toLocaleDateString()} ${openedAt.toLocaleTimeString()}`);

      // Create session
      const session = await prisma.pOS_Session.create({
        data: {
          openedBy: adminUser.id,
          openedAt,
          closedAt,
          status: 'closed',
          closingTotal: 0, // Will update after orders
        },
      });

      totalSessions++;

      // Generate 8-15 orders per session
      const ordersInSession = randomInt(8, 15);
      let sessionRevenue = 0;

      for (let j = 0; j < ordersInSession; j++) {
        // Random time during session
        const orderTime = new Date(
          openedAt.getTime() + 
          Math.random() * (closedAt.getTime() - openedAt.getTime())
        );

        // Random table
        const table = randomChoice(tables);

        // Create order
        const order = await prisma.order.create({
          data: {
            sessionId: session.id,
            userId: adminUser.id,
            tableId: table.id,
            status: 'paid',
            createdAt: orderTime,
            updatedAt: addMinutes(orderTime, randomInt(15, 45)), // 15-45 min order duration
            total: 0, // Will calculate
          },
        });

        // Add 2-6 items to order
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

        // Create order lines
        await prisma.orderLine.createMany({
          data: selectedProducts,
        });

        // Calculate order total
        const orderTotal = selectedProducts.reduce((sum, item) => {
          return sum + (item.price * item.qty) + item.taxAmount;
        }, 0);

        // Update order total
        await prisma.order.update({
          where: { id: order.id },
          data: { total: orderTotal },
        });

        // Create payment
        const paymentMethod = getRandomPaymentMethod();
        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: orderTotal,
            method: paymentMethod,
            createdAt: addMinutes(orderTime, randomInt(15, 45)),
          },
        });

        // Create kitchen ticket for items that need kitchen
        const hasKitchenItems = selectedProducts.some(item => {
          const prod = products.find(p => p.id === item.productId);
          return prod?.sendToKitchen;
        });

        if (hasKitchenItems) {
          await prisma.kitchenTicket.create({
            data: {
              orderId: order.id,
              status: 'completed',
              createdAt: orderTime,
              updatedAt: addMinutes(orderTime, randomInt(10, 30)),
            },
          });
        }

        sessionRevenue += orderTotal;
        totalOrders++;
        totalRevenue += orderTotal;
      }

      // Update session closing total
      await prisma.pOS_Session.update({
        where: { id: session.id },
        data: { closingTotal: sessionRevenue },
      });

      console.log(`   ✓ Created ${ordersInSession} orders, Revenue: ₹${sessionRevenue.toFixed(2)}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Transaction seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Sessions created: ${totalSessions}`);
    console.log(`   Orders created: ${totalOrders}`);
    console.log(`   Total revenue: ₹${totalRevenue.toFixed(2)}`);
    console.log(`   Average order value: ₹${(totalRevenue / totalOrders).toFixed(2)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show payment method breakdown
    const paymentBreakdown = await prisma.payment.groupBy({
      by: ['method'],
      _sum: {
        amount: true,
      },
      _count: {
        method: true,
      },
    });

    console.log('💳 Payment Method Breakdown:\n');
    paymentBreakdown.forEach(pm => {
      const percentage = ((pm._sum.amount / totalRevenue) * 100).toFixed(1);
      console.log(`   ${pm.method.toUpperCase()}: ₹${pm._sum.amount.toFixed(2)} (${percentage}%) - ${pm._count.method} transactions`);
    });
    console.log('');

    // Show top products
    const topProducts = await prisma.orderLine.groupBy({
      by: ['productId', 'name'],
      _sum: {
        qty: true,
      },
      orderBy: {
        _sum: {
          qty: 'desc',
        },
      },
      take: 10,
    });

    console.log('🏆 Top 10 Products Sold:\n');
    topProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - ${product._sum.qty} units`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

seedTransactions()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });