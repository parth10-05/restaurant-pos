/**
 * AI-Optimized Seed Script
 * Creates comprehensive historical data suitable for AI predictions
 * 
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper to add days to a date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Helper to add hours
const addHours = (date, hours) => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

// Random number in range
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, decimals = 2) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Weighted random selection
const weightedRandom = (items, weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
};

async function main() {
  console.log('🧹 Cleaning database...');
  
  // Delete in order of dependencies
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
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@restaurant.com',
      password: hashedPassword,
      role: 'admin'
    }
  });

  const cashier1 = await prisma.user.create({
    data: {
      email: 'cashier1@restaurant.com',
      password: hashedPassword,
      role: 'cashier'
    }
  });

  const cashier2 = await prisma.user.create({
    data: {
      email: 'cashier2@restaurant.com',
      password: hashedPassword,
      role: 'cashier'
    }
  });

  const kitchen = await prisma.user.create({
    data: {
      email: 'kitchen@restaurant.com',
      password: hashedPassword,
      role: 'kitchen'
    }
  });

  console.log('✅ Created 4 users');

  // ═══════════════════════════════════════════════════════════════════════════
  // POS CONFIG & RECEIPT SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.posConfig.create({
    data: {
      posName: 'Restaurant POS',
      defaultTax: 5.0,
      enableKitchenDisplay: true,
      enableCash: true,
      enableDigital: true,
      enableUpi: true,
      upiId: 'restaurant@upi'
    }
  });

  await prisma.receiptSettings.create({
    data: {
      restaurantName: 'Sample Restaurant',
      address: '123 Food Street, Mumbai 400001',
      phone: '+91 22 1234 5678',
      gstNumber: 'GSTIN123456789',
      showOrderNumber: true,
      showCashier: true,
      showPaymentMethod: true,
      footerText: 'Thank you for dining with us!'
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOORS & TABLES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🏠 Creating floors and tables...');

  const mainFloor = await prisma.floor.create({
    data: { name: 'Main Floor', sequence: 1, active: true }
  });

  const outdoorFloor = await prisma.floor.create({
    data: { name: 'Outdoor', sequence: 2, active: true }
  });

  const tables = [];
  // Main floor: 10 tables
  for (let i = 1; i <= 10; i++) {
    const t = await prisma.table.create({
      data: {
        number: i,
        seats: i <= 4 ? 2 : (i <= 8 ? 4 : 6),
        floorId: mainFloor.id,
        active: true
      }
    });
    tables.push(t);
  }
  // Outdoor: 5 tables
  for (let i = 1; i <= 5; i++) {
    const t = await prisma.table.create({
      data: {
        number: i,
        seats: 4,
        floorId: outdoorFloor.id,
        active: true
      }
    });
    tables.push(t);
  }

  console.log(`✅ Created 2 floors, ${tables.length} tables`);

  // ═══════════════════════════════════════════════════════════════════════════
  // INGREDIENTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🥕 Creating ingredients...');

  const ingredientsData = [
    // Proteins
    { name: 'Chicken Breast', unit: 'kg', costPerUnit: 280, minStock: 5 },
    { name: 'Ground Beef', unit: 'kg', costPerUnit: 450, minStock: 3 },
    { name: 'Paneer', unit: 'kg', costPerUnit: 320, minStock: 4 },
    { name: 'Fish Fillet', unit: 'kg', costPerUnit: 520, minStock: 2 },
    { name: 'Eggs', unit: 'pcs', costPerUnit: 8, minStock: 50 },
    { name: 'Prawns', unit: 'kg', costPerUnit: 680, minStock: 2 },
    
    // Carbs
    { name: 'Rice', unit: 'kg', costPerUnit: 65, minStock: 20 },
    { name: 'Pasta', unit: 'kg', costPerUnit: 120, minStock: 5 },
    { name: 'Bread', unit: 'pcs', costPerUnit: 5, minStock: 30 },
    { name: 'Naan Dough', unit: 'kg', costPerUnit: 45, minStock: 5 },
    { name: 'Burger Buns', unit: 'pcs', costPerUnit: 12, minStock: 40 },
    
    // Vegetables
    { name: 'Tomatoes', unit: 'kg', costPerUnit: 40, minStock: 10 },
    { name: 'Onions', unit: 'kg', costPerUnit: 30, minStock: 15 },
    { name: 'Potatoes', unit: 'kg', costPerUnit: 35, minStock: 20 },
    { name: 'Lettuce', unit: 'kg', costPerUnit: 80, minStock: 3 },
    { name: 'Bell Peppers', unit: 'kg', costPerUnit: 120, minStock: 3 },
    { name: 'Mushrooms', unit: 'kg', costPerUnit: 180, minStock: 2 },
    { name: 'Spinach', unit: 'kg', costPerUnit: 60, minStock: 2 },
    
    // Dairy
    { name: 'Cheese (Mozzarella)', unit: 'kg', costPerUnit: 450, minStock: 3 },
    { name: 'Butter', unit: 'kg', costPerUnit: 520, minStock: 2 },
    { name: 'Cream', unit: 'l', costPerUnit: 180, minStock: 3 },
    { name: 'Milk', unit: 'l', costPerUnit: 55, minStock: 10 },
    
    // Sauces & Condiments
    { name: 'Tomato Sauce', unit: 'l', costPerUnit: 85, minStock: 5 },
    { name: 'Mayonnaise', unit: 'l', costPerUnit: 140, minStock: 2 },
    { name: 'Olive Oil', unit: 'l', costPerUnit: 380, minStock: 3 },
    { name: 'Curry Paste', unit: 'kg', costPerUnit: 220, minStock: 2 },
    
    // Beverages
    { name: 'Coffee Beans', unit: 'kg', costPerUnit: 650, minStock: 3 },
    { name: 'Tea Leaves', unit: 'kg', costPerUnit: 420, minStock: 1 },
    { name: 'Soft Drink Syrup', unit: 'l', costPerUnit: 120, minStock: 5 },
    { name: 'Fresh Juice Fruits', unit: 'kg', costPerUnit: 100, minStock: 10 },
    
    // Desserts
    { name: 'Flour', unit: 'kg', costPerUnit: 45, minStock: 10 },
    { name: 'Sugar', unit: 'kg', costPerUnit: 50, minStock: 10 },
    { name: 'Ice Cream Base', unit: 'l', costPerUnit: 200, minStock: 5 },
    { name: 'Chocolate', unit: 'kg', costPerUnit: 380, minStock: 2 }
  ];

  const ingredients = {};
  for (const ing of ingredientsData) {
    const created = await prisma.ingredient.create({
      data: {
        ...ing,
        isActive: true,
        // Add stock
        stock: {
          create: {
            quantity: ing.minStock * randFloat(2, 5)
          }
        }
      }
    });
    ingredients[ing.name] = created;
  }

  console.log(`✅ Created ${Object.keys(ingredients).length} ingredients`);

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORIES & PRODUCTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📦 Creating categories and products...');

  const categories = {
    starters: await prisma.productCategory.create({
      data: { name: 'Starters', sequence: 1, active: true }
    }),
    mains: await prisma.productCategory.create({
      data: { name: 'Main Course', sequence: 2, active: true }
    }),
    burgers: await prisma.productCategory.create({
      data: { name: 'Burgers & Sandwiches', sequence: 3, active: true }
    }),
    pasta: await prisma.productCategory.create({
      data: { name: 'Pasta & Noodles', sequence: 4, active: true }
    }),
    indian: await prisma.productCategory.create({
      data: { name: 'Indian', sequence: 5, active: true }
    }),
    beverages: await prisma.productCategory.create({
      data: { name: 'Beverages', sequence: 6, active: true }
    }),
    desserts: await prisma.productCategory.create({
      data: { name: 'Desserts', sequence: 7, active: true }
    })
  };

  // Products with their ingredients
  const productsData = [
    // Starters
    {
      name: 'Crispy Chicken Wings', price: 280, categoryId: categories.starters.id,
      station: 'FRYER', ingredients: [
        { name: 'Chicken Breast', qty: 0.25 },
        { name: 'Flour', qty: 0.03 },
        { name: 'Butter', qty: 0.02 }
      ]
    },
    {
      name: 'Garlic Bread', price: 150, categoryId: categories.starters.id,
      station: 'GRILL', ingredients: [
        { name: 'Bread', qty: 2 },
        { name: 'Butter', qty: 0.03 },
        { name: 'Cheese (Mozzarella)', qty: 0.03 }
      ]
    },
    {
      name: 'Paneer Tikka', price: 260, categoryId: categories.starters.id,
      station: 'GRILL', ingredients: [
        { name: 'Paneer', qty: 0.15 },
        { name: 'Bell Peppers', qty: 0.05 },
        { name: 'Onions', qty: 0.03 },
        { name: 'Curry Paste', qty: 0.02 }
      ]
    },
    {
      name: 'French Fries', price: 120, categoryId: categories.starters.id,
      station: 'FRYER', ingredients: [
        { name: 'Potatoes', qty: 0.2 },
        { name: 'Olive Oil', qty: 0.02 }
      ]
    },
    {
      name: 'Mushroom Soup', price: 180, categoryId: categories.starters.id,
      station: 'GENERAL', ingredients: [
        { name: 'Mushrooms', qty: 0.1 },
        { name: 'Cream', qty: 0.05 },
        { name: 'Butter', qty: 0.02 },
        { name: 'Onions', qty: 0.03 }
      ]
    },

    // Main Course
    {
      name: 'Grilled Chicken Steak', price: 450, categoryId: categories.mains.id,
      station: 'GRILL', ingredients: [
        { name: 'Chicken Breast', qty: 0.25 },
        { name: 'Butter', qty: 0.03 },
        { name: 'Potatoes', qty: 0.15 },
        { name: 'Bell Peppers', qty: 0.05 }
      ]
    },
    {
      name: 'Fish & Chips', price: 380, categoryId: categories.mains.id,
      station: 'FRYER', ingredients: [
        { name: 'Fish Fillet', qty: 0.2 },
        { name: 'Potatoes', qty: 0.2 },
        { name: 'Flour', qty: 0.05 }
      ]
    },
    {
      name: 'Prawn Tempura', price: 520, categoryId: categories.mains.id,
      station: 'FRYER', ingredients: [
        { name: 'Prawns', qty: 0.15 },
        { name: 'Flour', qty: 0.03 },
        { name: 'Eggs', qty: 1 }
      ]
    },

    // Burgers
    {
      name: 'Classic Beef Burger', price: 320, categoryId: categories.burgers.id,
      station: 'GRILL', ingredients: [
        { name: 'Ground Beef', qty: 0.15 },
        { name: 'Burger Buns', qty: 1 },
        { name: 'Lettuce', qty: 0.02 },
        { name: 'Tomatoes', qty: 0.03 },
        { name: 'Cheese (Mozzarella)', qty: 0.03 },
        { name: 'Mayonnaise', qty: 0.02 }
      ]
    },
    {
      name: 'Chicken Burger', price: 280, categoryId: categories.burgers.id,
      station: 'GRILL', ingredients: [
        { name: 'Chicken Breast', qty: 0.12 },
        { name: 'Burger Buns', qty: 1 },
        { name: 'Lettuce', qty: 0.02 },
        { name: 'Tomatoes', qty: 0.03 },
        { name: 'Mayonnaise', qty: 0.02 }
      ]
    },
    {
      name: 'Veggie Burger', price: 220, categoryId: categories.burgers.id,
      station: 'GRILL', ingredients: [
        { name: 'Paneer', qty: 0.08 },
        { name: 'Burger Buns', qty: 1 },
        { name: 'Lettuce', qty: 0.02 },
        { name: 'Tomatoes', qty: 0.03 },
        { name: 'Mushrooms', qty: 0.03 }
      ]
    },

    // Pasta
    {
      name: 'Spaghetti Bolognese', price: 340, categoryId: categories.pasta.id,
      station: 'GENERAL', ingredients: [
        { name: 'Pasta', qty: 0.12 },
        { name: 'Ground Beef', qty: 0.1 },
        { name: 'Tomato Sauce', qty: 0.08 },
        { name: 'Onions', qty: 0.03 },
        { name: 'Cheese (Mozzarella)', qty: 0.02 }
      ]
    },
    {
      name: 'Penne Alfredo', price: 320, categoryId: categories.pasta.id,
      station: 'GENERAL', ingredients: [
        { name: 'Pasta', qty: 0.12 },
        { name: 'Cream', qty: 0.08 },
        { name: 'Butter', qty: 0.03 },
        { name: 'Cheese (Mozzarella)', qty: 0.04 }
      ]
    },
    {
      name: 'Mushroom Pasta', price: 300, categoryId: categories.pasta.id,
      station: 'GENERAL', ingredients: [
        { name: 'Pasta', qty: 0.12 },
        { name: 'Mushrooms', qty: 0.1 },
        { name: 'Cream', qty: 0.05 },
        { name: 'Spinach', qty: 0.03 }
      ]
    },

    // Indian
    {
      name: 'Butter Chicken', price: 380, categoryId: categories.indian.id,
      station: 'GENERAL', ingredients: [
        { name: 'Chicken Breast', qty: 0.2 },
        { name: 'Butter', qty: 0.04 },
        { name: 'Cream', qty: 0.05 },
        { name: 'Tomato Sauce', qty: 0.06 },
        { name: 'Curry Paste', qty: 0.03 }
      ]
    },
    {
      name: 'Paneer Butter Masala', price: 320, categoryId: categories.indian.id,
      station: 'GENERAL', ingredients: [
        { name: 'Paneer', qty: 0.15 },
        { name: 'Butter', qty: 0.03 },
        { name: 'Cream', qty: 0.04 },
        { name: 'Tomato Sauce', qty: 0.05 },
        { name: 'Curry Paste', qty: 0.02 }
      ]
    },
    {
      name: 'Dal Tadka', price: 220, categoryId: categories.indian.id,
      station: 'GENERAL', ingredients: [
        { name: 'Butter', qty: 0.02 },
        { name: 'Onions', qty: 0.03 },
        { name: 'Tomatoes', qty: 0.03 },
        { name: 'Curry Paste', qty: 0.02 }
      ]
    },
    {
      name: 'Biryani', price: 350, categoryId: categories.indian.id,
      station: 'GENERAL', ingredients: [
        { name: 'Rice', qty: 0.15 },
        { name: 'Chicken Breast', qty: 0.15 },
        { name: 'Onions', qty: 0.05 },
        { name: 'Curry Paste', qty: 0.03 }
      ]
    },
    {
      name: 'Naan', price: 60, categoryId: categories.indian.id,
      station: 'GRILL', ingredients: [
        { name: 'Naan Dough', qty: 0.08 },
        { name: 'Butter', qty: 0.01 }
      ]
    },
    {
      name: 'Jeera Rice', price: 140, categoryId: categories.indian.id,
      station: 'GENERAL', ingredients: [
        { name: 'Rice', qty: 0.12 },
        { name: 'Butter', qty: 0.01 }
      ]
    },

    // Beverages
    {
      name: 'Fresh Lime Soda', price: 80, categoryId: categories.beverages.id,
      station: 'DRINKS', ingredients: [
        { name: 'Fresh Juice Fruits', qty: 0.05 },
        { name: 'Sugar', qty: 0.02 }
      ]
    },
    {
      name: 'Cold Coffee', price: 150, categoryId: categories.beverages.id,
      station: 'DRINKS', ingredients: [
        { name: 'Coffee Beans', qty: 0.02 },
        { name: 'Milk', qty: 0.2 },
        { name: 'Sugar', qty: 0.02 },
        { name: 'Ice Cream Base', qty: 0.03 }
      ]
    },
    {
      name: 'Hot Coffee', price: 100, categoryId: categories.beverages.id,
      station: 'DRINKS', ingredients: [
        { name: 'Coffee Beans', qty: 0.015 },
        { name: 'Milk', qty: 0.1 },
        { name: 'Sugar', qty: 0.01 }
      ]
    },
    {
      name: 'Fresh Orange Juice', price: 120, categoryId: categories.beverages.id,
      station: 'DRINKS', ingredients: [
        { name: 'Fresh Juice Fruits', qty: 0.2 },
        { name: 'Sugar', qty: 0.01 }
      ]
    },
    {
      name: 'Masala Chai', price: 60, categoryId: categories.beverages.id,
      station: 'DRINKS', ingredients: [
        { name: 'Tea Leaves', qty: 0.005 },
        { name: 'Milk', qty: 0.15 },
        { name: 'Sugar', qty: 0.015 }
      ]
    },
    {
      name: 'Soft Drink', price: 60, categoryId: categories.beverages.id,
      station: 'DRINKS', ingredients: [
        { name: 'Soft Drink Syrup', qty: 0.05 }
      ]
    },

    // Desserts
    {
      name: 'Chocolate Brownie', price: 180, categoryId: categories.desserts.id,
      station: 'DESSERT', ingredients: [
        { name: 'Chocolate', qty: 0.05 },
        { name: 'Butter', qty: 0.03 },
        { name: 'Flour', qty: 0.04 },
        { name: 'Eggs', qty: 1 },
        { name: 'Sugar', qty: 0.04 }
      ]
    },
    {
      name: 'Ice Cream Sundae', price: 160, categoryId: categories.desserts.id,
      station: 'DESSERT', ingredients: [
        { name: 'Ice Cream Base', qty: 0.15 },
        { name: 'Chocolate', qty: 0.02 }
      ]
    },
    {
      name: 'Gulab Jamun', price: 120, categoryId: categories.desserts.id,
      station: 'DESSERT', ingredients: [
        { name: 'Milk', qty: 0.1 },
        { name: 'Flour', qty: 0.03 },
        { name: 'Sugar', qty: 0.05 }
      ]
    },
    {
      name: 'Cheesecake', price: 220, categoryId: categories.desserts.id,
      station: 'DESSERT', ingredients: [
        { name: 'Cheese (Mozzarella)', qty: 0.08 },
        { name: 'Cream', qty: 0.05 },
        { name: 'Sugar', qty: 0.03 },
        { name: 'Butter', qty: 0.02 }
      ]
    }
  ];

  const products = [];
  for (const prod of productsData) {
    const created = await prisma.product.create({
      data: {
        name: prod.name,
        price: prod.price,
        taxPercent: 5,
        categoryId: prod.categoryId,
        kitchenStation: prod.station,
        sendToKitchen: prod.station !== 'DRINKS',
        isActive: true,
        productIngredients: {
          create: prod.ingredients.map(ing => ({
            ingredientId: ingredients[ing.name].id,
            quantity: ing.qty
          }))
        }
      }
    });
    products.push({ ...created, _ingredients: prod.ingredients });
  }

  console.log(`✅ Created ${Object.keys(categories).length} categories, ${products.length} products`);

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORICAL DATA (30 days back - optimized for quick seeding)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📈 Creating historical data (30 days)...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = addDays(today, -30);

  // Product popularity weights (for realistic ordering patterns)
  const productWeights = products.map(p => {
    // Higher weights for popular items
    if (p.name.includes('Burger') || p.name.includes('Chicken') || p.name.includes('Biryani')) return 3;
    if (p.name.includes('Coffee') || p.name.includes('Chai') || p.name.includes('Naan')) return 2.5;
    if (p.name.includes('Soft Drink') || p.name.includes('Fries')) return 2;
    return 1;
  });

  // Day of week multipliers (busier on weekends)
  const dayMultipliers = [0.8, 0.7, 0.8, 0.9, 1.1, 1.4, 1.3]; // Sun-Sat

  // Track ingredient consumption for ledger
  const ingredientBalances = {};
  for (const ing of Object.values(ingredients)) {
    const stock = await prisma.inventoryStock.findUnique({ where: { ingredientId: ing.id } });
    ingredientBalances[ing.id] = stock?.quantity || 0;
  }

  let totalOrders = 0;
  let totalWasteEvents = 0;

  // Generate data day by day
  for (let dayOffset = -30; dayOffset <= 0; dayOffset++) {
    const currentDate = addDays(today, dayOffset);
    const dayOfWeek = currentDate.getDay();
    const baseOrders = Math.floor(randInt(15, 30) * dayMultipliers[dayOfWeek]);

    // Create session for the day
    const sessionOpenTime = new Date(currentDate);
    sessionOpenTime.setHours(10, 0, 0, 0);
    const sessionCloseTime = new Date(currentDate);
    sessionCloseTime.setHours(22, 0, 0, 0);

    const session = await prisma.pOS_Session.create({
      data: {
        openedAt: sessionOpenTime,
        closedAt: sessionCloseTime,
        status: 'closed',
        openedBy: [cashier1.id, cashier2.id][randInt(0, 1)],
        closingTotal: 0
      }
    });

    let sessionTotal = 0;

    // Generate orders for the day
    for (let o = 0; o < baseOrders; o++) {
      const orderTime = addHours(sessionOpenTime, randInt(0, 11) + Math.random());
      const orderUser = [cashier1.id, cashier2.id][randInt(0, 1)];
      const orderTable = tables[randInt(0, tables.length - 1)];

      // Determine items in order (2-5 items)
      const numItems = randInt(2, 5);
      const orderProducts = [];
      for (let i = 0; i < numItems; i++) {
        const prod = weightedRandom(products, productWeights);
        const qty = i === 0 ? randInt(1, 2) : 1; // First item might have qty 2
        orderProducts.push({ product: prod, qty });
      }

      // Calculate order total
      const orderTotal = orderProducts.reduce((sum, { product, qty }) => 
        sum + (product.price * qty * 1.05), 0
      );

      const order = await prisma.order.create({
        data: {
          sessionId: session.id,
          userId: orderUser,
          tableId: orderTable.id,
          status: 'completed',
          total: orderTotal,
          createdAt: orderTime,
          updatedAt: orderTime,
          orderLines: {
            create: orderProducts.map(({ product, qty }) => ({
              productId: product.id,
              name: product.name,
              price: product.price,
              qty,
              taxAmount: product.price * qty * 0.05,
              kitchenStation: product.kitchenStation,
              sentToKitchen: true,
              kitchenStatus: 'READY',
              sentToKitchenAt: orderTime,
              preparedAt: addHours(orderTime, randFloat(0.1, 0.4))
            }))
          },
          payment: {
            create: {
              amount: orderTotal,
              method: weightedRandom(['Cash', 'Card', 'UPI'], [40, 35, 25]),
              createdAt: orderTime
            }
          }
        }
      });

      // Create inventory ledger entries for consumption
      for (const { product, qty } of orderProducts) {
        const prodData = products.find(p => p.id === product.id);
        if (prodData?._ingredients) {
          for (const ing of prodData._ingredients) {
            const ingredientId = ingredients[ing.name].id;
            const consumed = ing.qty * qty;
            ingredientBalances[ingredientId] = Math.max(0, ingredientBalances[ingredientId] - consumed);

            await prisma.inventoryLedger.create({
              data: {
                ingredientId,
                changeQty: -consumed,
                balanceAfter: ingredientBalances[ingredientId],
                source: 'ORDER_CONSUMPTION',
                referenceId: order.id,
                createdBy: orderUser,
                createdAt: orderTime
              }
            });
          }
        }
      }

      sessionTotal += orderTotal;
      totalOrders++;
    }

    // Update session total
    await prisma.pOS_Session.update({
      where: { id: session.id },
      data: { closingTotal: sessionTotal }
    });

    // Generate waste events (1-4 per day, more on busy days)
    const wasteCount = randInt(1, Math.ceil(4 * dayMultipliers[dayOfWeek]));
    const wasteReasons = ['SPOILAGE', 'OVERCOOKED', 'RETURNED', 'PREP_LOSS'];
    const wasteReasonWeights = [35, 25, 15, 25];
    const stations = ['GRILL', 'FRYER', 'DRINKS', 'DESSERT', 'GENERAL'];

    for (let w = 0; w < wasteCount; w++) {
      const wasteTime = addHours(sessionOpenTime, randInt(1, 10));
      const wasteIngredient = Object.values(ingredients)[randInt(0, Object.keys(ingredients).length - 1)];
      const wasteQty = randFloat(0.1, 0.5);
      const reason = weightedRandom(wasteReasons, wasteReasonWeights);
      const station = stations[randInt(0, stations.length - 1)];

      await prisma.wasteEvent.create({
        data: {
          ingredientId: wasteIngredient.id,
          quantity: wasteQty,
          reason,
          station,
          sessionId: session.id,
          createdBy: [cashier1.id, cashier2.id, kitchen.id][randInt(0, 2)],
          createdAt: wasteTime,
          notes: reason === 'RETURNED' ? 'Customer complaint' : null
        }
      });

      // Update inventory ledger for waste
      ingredientBalances[wasteIngredient.id] = Math.max(0, ingredientBalances[wasteIngredient.id] - wasteQty);
      
      await prisma.inventoryLedger.create({
        data: {
          ingredientId: wasteIngredient.id,
          changeQty: -wasteQty,
          balanceAfter: ingredientBalances[wasteIngredient.id],
          source: 'WASTE',
          notes: `Waste: ${reason}`,
          createdBy: kitchen.id,
          createdAt: wasteTime
        }
      });

      totalWasteEvents++;
    }

    // Weekly restocking (every Sunday)
    if (dayOfWeek === 0) {
      for (const ing of Object.values(ingredients)) {
        const restockQty = ing.minStock * randFloat(3, 6);
        ingredientBalances[ing.id] += restockQty;

        await prisma.inventoryLedger.create({
          data: {
            ingredientId: ing.id,
            changeQty: restockQty,
            balanceAfter: ingredientBalances[ing.id],
            source: 'PURCHASE',
            notes: 'Weekly restock',
            createdBy: admin.id,
            createdAt: addHours(sessionOpenTime, -2)
          }
        });
      }
    }
  }

  // Update final inventory stock levels
  for (const ing of Object.values(ingredients)) {
    await prisma.inventoryStock.update({
      where: { ingredientId: ing.id },
      data: { 
        quantity: ingredientBalances[ing.id],
        lastUpdated: new Date()
      }
    });
  }

  console.log(`✅ Created ${totalOrders} orders over 30 days`);
  console.log(`✅ Created ${totalWasteEvents} waste events`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🎉 Database seeded successfully!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Users: 4 (admin@restaurant.com / password123)`);
  console.log(`Categories: ${Object.keys(categories).length}`);
  console.log(`Products: ${products.length}`);
  console.log(`Ingredients: ${Object.keys(ingredients).length}`);
  console.log(`Tables: ${tables.length}`);
  console.log(`Historical Orders: ${totalOrders} (30 days)`);
  console.log(`Waste Events: ${totalWasteEvents}`);
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
