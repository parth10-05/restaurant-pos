/**
 * AI-Optimized Seed Script (Simplified)
 * Creates comprehensive historical data suitable for AI predictions
 * 
 * Run with: npm run db:seed-ai
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper functions
const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

async function main() {
  console.log('🧹 Cleaning database...');
  
  // Delete in correct order
  await prisma.payment.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.kitchenTicket.deleteMany();
  await prisma.inventoryLedger.deleteMany();
  await prisma.wasteEvent.deleteMany();
  await prisma.productIngredient.deleteMany();
  await prisma.inventoryStock.deleteMany();
  await prisma.salesAnomaly.deleteMany();
  await prisma.productDemandForecast.deleteMany();
  await prisma.salesForecast.deleteMany();
  await prisma.aIJob.deleteMany();
  await prisma.order.deleteMany();
  await prisma.pOS_Session.deleteMany();
  await prisma.table.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.posConfig.deleteMany();
  await prisma.receiptSettings.deleteMany();
  console.log('✅ Database cleaned');

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    prisma.user.create({ data: { email: 'admin@restaurant.com', password: hashedPassword, role: 'admin' } }),
    prisma.user.create({ data: { email: 'cashier@restaurant.com', password: hashedPassword, role: 'cashier' } }),
    prisma.user.create({ data: { email: 'kitchen@restaurant.com', password: hashedPassword, role: 'kitchen' } })
  ]);
  const [admin, cashier, kitchen] = users;
  console.log('✅ Created users');

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIG
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.posConfig.create({
    data: { posName: 'Restaurant POS', defaultTax: 5.0, enableKitchenDisplay: true }
  });
  await prisma.receiptSettings.create({
    data: { restaurantName: 'Sample Restaurant', address: '123 Food St' }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOORS & TABLES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🏠 Creating floors and tables...');
  const floor = await prisma.floor.create({ data: { name: 'Main Floor', sequence: 1 } });
  const tables = [];
  for (let i = 1; i <= 10; i++) {
    const t = await prisma.table.create({ data: { number: i, seats: 4, floorId: floor.id } });
    tables.push(t);
  }
  console.log('✅ Created tables');

  // ═══════════════════════════════════════════════════════════════════════════
  // INGREDIENTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🥕 Creating ingredients...');
  const ingredientDefs = [
    { name: 'Chicken', unit: 'kg', costPerUnit: 280, minStock: 5, stockQty: 25 },
    { name: 'Rice', unit: 'kg', costPerUnit: 65, minStock: 10, stockQty: 50 },
    { name: 'Tomato', unit: 'kg', costPerUnit: 40, minStock: 5, stockQty: 20 },
    { name: 'Onion', unit: 'kg', costPerUnit: 30, minStock: 5, stockQty: 25 },
    { name: 'Paneer', unit: 'kg', costPerUnit: 320, minStock: 3, stockQty: 15 },
    { name: 'Potato', unit: 'kg', costPerUnit: 35, minStock: 10, stockQty: 40 },
    { name: 'Butter', unit: 'kg', costPerUnit: 520, minStock: 2, stockQty: 8 },
    { name: 'Cream', unit: 'l', costPerUnit: 180, minStock: 3, stockQty: 10 },
    { name: 'Pasta', unit: 'kg', costPerUnit: 120, minStock: 5, stockQty: 20 },
    { name: 'Cheese', unit: 'kg', costPerUnit: 450, minStock: 3, stockQty: 12 },
    { name: 'Coffee', unit: 'kg', costPerUnit: 650, minStock: 2, stockQty: 5 },
    { name: 'Milk', unit: 'l', costPerUnit: 55, minStock: 10, stockQty: 30 },
    { name: 'Sugar', unit: 'kg', costPerUnit: 50, minStock: 5, stockQty: 15 },
    { name: 'Flour', unit: 'kg', costPerUnit: 45, minStock: 5, stockQty: 20 },
    { name: 'Eggs', unit: 'pcs', costPerUnit: 8, minStock: 30, stockQty: 100 }
  ];

  const ingredients = {};
  for (const ing of ingredientDefs) {
    const { stockQty, ...data } = ing;
    const created = await prisma.ingredient.create({
      data: { ...data, stock: { create: { quantity: stockQty } } }
    });
    ingredients[ing.name] = created;
  }
  console.log(`✅ Created ${Object.keys(ingredients).length} ingredients`);

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORIES & PRODUCTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📦 Creating products...');
  const categories = {
    main: await prisma.productCategory.create({ data: { name: 'Main Course', sequence: 1 } }),
    starter: await prisma.productCategory.create({ data: { name: 'Starters', sequence: 2 } }),
    beverage: await prisma.productCategory.create({ data: { name: 'Beverages', sequence: 3 } }),
    dessert: await prisma.productCategory.create({ data: { name: 'Desserts', sequence: 4 } })
  };

  const productDefs = [
    // Main Course
    { name: 'Butter Chicken', price: 380, cat: 'main', station: 'GENERAL', ings: [['Chicken', 0.2], ['Butter', 0.04], ['Cream', 0.05]] },
    { name: 'Biryani', price: 350, cat: 'main', station: 'GENERAL', ings: [['Chicken', 0.15], ['Rice', 0.15], ['Onion', 0.05]] },
    { name: 'Paneer Masala', price: 320, cat: 'main', station: 'GENERAL', ings: [['Paneer', 0.15], ['Tomato', 0.1], ['Cream', 0.04]] },
    { name: 'Pasta Alfredo', price: 320, cat: 'main', station: 'GENERAL', ings: [['Pasta', 0.12], ['Cream', 0.08], ['Cheese', 0.04]] },
    // Starters
    { name: 'French Fries', price: 120, cat: 'starter', station: 'FRYER', ings: [['Potato', 0.2]] },
    { name: 'Chicken Wings', price: 280, cat: 'starter', station: 'FRYER', ings: [['Chicken', 0.25], ['Flour', 0.03]] },
    { name: 'Paneer Tikka', price: 260, cat: 'starter', station: 'GRILL', ings: [['Paneer', 0.15], ['Onion', 0.03]] },
    { name: 'Garlic Bread', price: 150, cat: 'starter', station: 'GRILL', ings: [['Flour', 0.1], ['Butter', 0.02], ['Cheese', 0.02]] },
    // Beverages
    { name: 'Coffee', price: 100, cat: 'beverage', station: 'DRINKS', ings: [['Coffee', 0.015], ['Milk', 0.15], ['Sugar', 0.01]] },
    { name: 'Masala Chai', price: 60, cat: 'beverage', station: 'DRINKS', ings: [['Milk', 0.15], ['Sugar', 0.015]] },
    // Desserts
    { name: 'Brownie', price: 180, cat: 'dessert', station: 'DESSERT', ings: [['Flour', 0.04], ['Eggs', 1], ['Sugar', 0.04]] },
    { name: 'Ice Cream', price: 120, cat: 'dessert', station: 'DESSERT', ings: [['Milk', 0.1], ['Sugar', 0.02]] }
  ];

  const products = [];
  for (const p of productDefs) {
    const prod = await prisma.product.create({
      data: {
        name: p.name,
        price: p.price,
        taxPercent: 5,
        categoryId: categories[p.cat].id,
        kitchenStation: p.station,
        sendToKitchen: p.station !== 'DRINKS',
        productIngredients: {
          create: p.ings.map(([name, qty]) => ({
            ingredientId: ingredients[name].id,
            quantity: qty
          }))
        }
      }
    });
    products.push({ ...prod, ings: p.ings });
  }
  console.log(`✅ Created ${products.length} products`);

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORICAL DATA (14 days) - Minimal for AI testing
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📈 Creating historical data (14 days)...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Track inventory
  const balances = {};
  for (const ing of Object.values(ingredients)) {
    const stock = await prisma.inventoryStock.findUnique({ where: { ingredientId: ing.id } });
    balances[ing.id] = stock?.quantity || 20;
  }

  let orderCount = 0;
  let wasteCount = 0;

  for (let day = -14; day <= 0; day++) {
    const date = addDays(today, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dailyOrders = isWeekend ? randInt(20, 30) : randInt(12, 20);

    // Create session
    const sessionStart = new Date(date);
    sessionStart.setHours(10, 0, 0, 0);
    const sessionEnd = new Date(date);
    sessionEnd.setHours(22, 0, 0, 0);

    const session = await prisma.pOS_Session.create({
      data: {
        openedAt: sessionStart,
        closedAt: sessionEnd,
        status: 'closed',
        openedBy: cashier.id,
        closingTotal: 0
      }
    });

    let sessionTotal = 0;

    // Generate orders
    for (let o = 0; o < dailyOrders; o++) {
      const orderTime = addHours(sessionStart, randInt(0, 11) + Math.random());
      const table = tables[randInt(0, tables.length - 1)];
      
      // 2-4 products per order
      const numItems = randInt(2, 4);
      const orderItems = [];
      for (let i = 0; i < numItems; i++) {
        const prod = products[randInt(0, products.length - 1)];
        const qty = i === 0 ? randInt(1, 2) : 1;
        orderItems.push({ prod, qty });
      }

      const total = orderItems.reduce((s, { prod, qty }) => s + prod.price * qty * 1.05, 0);

      const order = await prisma.order.create({
        data: {
          sessionId: session.id,
          userId: cashier.id,
          tableId: table.id,
          status: 'completed',
          total,
          createdAt: orderTime,
          orderLines: {
            create: orderItems.map(({ prod, qty }) => ({
              productId: prod.id,
              name: prod.name,
              price: prod.price,
              qty,
              taxAmount: prod.price * qty * 0.05,
              kitchenStation: prod.kitchenStation,
              sentToKitchen: true,
              kitchenStatus: 'READY'
            }))
          },
          payment: {
            create: {
              amount: total,
              method: ['Cash', 'Card', 'UPI'][randInt(0, 2)]
            }
          }
        }
      });

      // Ledger entries for consumption
      for (const { prod, qty } of orderItems) {
        for (const [ingName, ingQty] of prod.ings) {
          const ing = ingredients[ingName];
          const consumed = ingQty * qty;
          balances[ing.id] = Math.max(0, balances[ing.id] - consumed);
          
          await prisma.inventoryLedger.create({
            data: {
              ingredientId: ing.id,
              changeQty: -consumed,
              balanceAfter: balances[ing.id],
              source: 'ORDER_CONSUMPTION',
              referenceId: order.id,
              createdBy: cashier.id,
              createdAt: orderTime
            }
          });
        }
      }

      sessionTotal += total;
      orderCount++;
    }

    // Update session total
    await prisma.pOS_Session.update({
      where: { id: session.id },
      data: { closingTotal: sessionTotal }
    });

    // Waste events (1-3 per day)
    const wasteToday = randInt(1, 3);
    const reasons = ['SPOILAGE', 'OVERCOOKED', 'PREP_LOSS', 'RETURNED'];
    const stations = ['GRILL', 'FRYER', 'GENERAL', 'DESSERT'];

    for (let w = 0; w < wasteToday; w++) {
      const wasteTime = addHours(sessionStart, randInt(1, 10));
      const ing = Object.values(ingredients)[randInt(0, Object.keys(ingredients).length - 1)];
      const wasteQty = randFloat(0.1, 0.5);

      await prisma.wasteEvent.create({
        data: {
          ingredientId: ing.id,
          quantity: wasteQty,
          reason: reasons[randInt(0, reasons.length - 1)],
          station: stations[randInt(0, stations.length - 1)],
          sessionId: session.id,
          createdBy: kitchen.id,
          createdAt: wasteTime
        }
      });

      balances[ing.id] = Math.max(0, balances[ing.id] - wasteQty);
      
      await prisma.inventoryLedger.create({
        data: {
          ingredientId: ing.id,
          changeQty: -wasteQty,
          balanceAfter: balances[ing.id],
          source: 'WASTE',
          notes: 'Waste event',
          createdBy: kitchen.id,
          createdAt: wasteTime
        }
      });

      wasteCount++;
    }

    // Weekly restock on Sundays
    if (dayOfWeek === 0) {
      for (const ing of Object.values(ingredients)) {
        const restockQty = ing.minStock * randFloat(3, 5);
        balances[ing.id] += restockQty;
        
        await prisma.inventoryLedger.create({
          data: {
            ingredientId: ing.id,
            changeQty: restockQty,
            balanceAfter: balances[ing.id],
            source: 'PURCHASE',
            notes: 'Weekly restock',
            createdBy: admin.id,
            createdAt: addHours(sessionStart, -1)
          }
        });
      }
    }

    if (day % 5 === 0) {
      console.log(`  Day ${day}: ${dailyOrders} orders, ${wasteToday} waste events`);
    }
  }

  // Update final stock levels
  for (const ing of Object.values(ingredients)) {
    await prisma.inventoryStock.update({
      where: { ingredientId: ing.id },
      data: { quantity: balances[ing.id] }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🎉 Database seeded successfully!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Login: admin@restaurant.com / password123`);
  console.log(`Products: ${products.length}`);
  console.log(`Ingredients: ${Object.keys(ingredients).length}`);
  console.log(`Orders: ${orderCount} (14 days)`);
  console.log(`Waste Events: ${wasteCount}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });