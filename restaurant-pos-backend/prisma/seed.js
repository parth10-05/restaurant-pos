import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ══════════════════════════════════════════════════════════════════════
  // 1. USERS
  // ══════════════════════════════════════════════════════════════════════
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: { email: 'admin@restaurant.com', password: hashedPassword, role: 'admin' },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@restaurant.com' },
    update: {},
    create: { email: 'cashier@restaurant.com', password: hashedPassword, role: 'cashier' },
  });

  const kitchen = await prisma.user.upsert({
    where: { email: 'kitchen@restaurant.com' },
    update: {},
    create: { email: 'kitchen@restaurant.com', password: hashedPassword, role: 'kitchen' },
  });

  console.log(`   ✓ Admin:   ${admin.email}`);
  console.log(`   ✓ Cashier: ${cashier.email}`);
  console.log(`   ✓ Kitchen: ${kitchen.email}\n`);

  // ══════════════════════════════════════════════════════════════════════
  // 2. POS CONFIG
  // ══════════════════════════════════════════════════════════════════════
  console.log('⚙️  Creating POS config...');
  const existingConfig = await prisma.posConfig.findFirst();
  if (!existingConfig) {
    await prisma.posConfig.create({
      data: {
        posName: 'Restaurant POS',
        defaultTax: 5.0,
        enableKitchenDisplay: true,
        enableCustomerDisplay: false,
        enableCash: true,
        enableDigital: true,
        enableUpi: true,
        upiId: 'restaurant@upi',
      },
    });
  }
  console.log('   ✓ POS config ready\n');

  // ══════════════════════════════════════════════════════════════════════
  // 3. RECEIPT SETTINGS
  // ══════════════════════════════════════════════════════════════════════
  console.log('🧾 Creating receipt settings...');
  const existingReceipt = await prisma.receiptSettings.findFirst();
  if (!existingReceipt) {
    await prisma.receiptSettings.create({
      data: {
        restaurantName: 'Sample Restaurant',
        address: '123 Main Street, Mumbai 400001',
        phone: '+91 9876543210',
        gstNumber: '27XXXXX1234X1ZX',
        showOrderNumber: true,
        showCashier: true,
        showPaymentMethod: true,
        showItemTax: true,
        showTotalTax: true,
        showQrCode: false,
        paperWidth: '80mm',
        fontScale: 'normal',
        footerText: 'Thank you for dining with us!',
      },
    });
  }
  console.log('   ✓ Receipt settings ready\n');

  // ══════════════════════════════════════════════════════════════════════
  // 4. FLOORS & TABLES
  // ══════════════════════════════════════════════════════════════════════
  console.log('🏢 Creating floors & tables...');

  const floorsData = [
    { name: 'Ground Floor', sequence: 1, tables: [
      { number: 1, seats: 2 },
      { number: 2, seats: 2 },
      { number: 3, seats: 4 },
      { number: 4, seats: 4 },
      { number: 5, seats: 6 },
      { number: 6, seats: 6 },
      { number: 7, seats: 8 },
    ]},
    { name: 'First Floor', sequence: 2, tables: [
      { number: 1, seats: 4 },
      { number: 2, seats: 4 },
      { number: 3, seats: 6 },
      { number: 4, seats: 6 },
      { number: 5, seats: 8 },
      { number: 6, seats: 10 },
    ]},
    { name: 'Terrace', sequence: 3, tables: [
      { number: 1, seats: 2 },
      { number: 2, seats: 2 },
      { number: 3, seats: 4 },
      { number: 4, seats: 4 },
    ]},
  ];

  for (const floorData of floorsData) {
    let floor = await prisma.floor.findFirst({ where: { name: floorData.name } });
    if (!floor) {
      floor = await prisma.floor.create({ data: { name: floorData.name, sequence: floorData.sequence } });
    }

    for (const t of floorData.tables) {
      const existing = await prisma.table.findFirst({
        where: { floorId: floor.id, number: t.number },
      });
      if (!existing) {
        await prisma.table.create({
          data: { number: t.number, seats: t.seats, floorId: floor.id },
        });
      }
    }
    console.log(`   ✓ ${floorData.name}: ${floorData.tables.length} tables`);
  }
  console.log('');

  // ══════════════════════════════════════════════════════════════════════
  // 5. CATEGORIES & PRODUCTS
  // ══════════════════════════════════════════════════════════════════════
  console.log('📋 Creating categories & products...');

  const menuData = [
    {
      category: { name: 'Starters', sequence: 1 },
      products: [
        { name: 'Paneer Tikka', price: 250, taxPercent: 5, kitchenStation: 'GRILL', description: 'Marinated cottage cheese grilled to perfection' },
        { name: 'Chicken Wings', price: 280, taxPercent: 5, kitchenStation: 'FRYER', description: 'Crispy fried chicken wings with spicy sauce' },
        { name: 'Veg Spring Rolls', price: 180, taxPercent: 5, kitchenStation: 'FRYER', description: 'Crispy rolls stuffed with vegetables' },
        { name: 'Fish Fingers', price: 320, taxPercent: 5, kitchenStation: 'FRYER', description: 'Golden fried fish fingers with tartar sauce' },
        { name: 'Mushroom Soup', price: 150, taxPercent: 5, kitchenStation: 'GENERAL', description: 'Creamy mushroom soup' },
      ],
    },
    {
      category: { name: 'Main Course', sequence: 2 },
      products: [
        { name: 'Butter Chicken', price: 350, taxPercent: 5, kitchenStation: 'GENERAL', description: 'Tender chicken in rich tomato-butter gravy' },
        { name: 'Paneer Butter Masala', price: 300, taxPercent: 5, kitchenStation: 'GENERAL', description: 'Cottage cheese in creamy tomato gravy' },
        { name: 'Dal Makhani', price: 250, taxPercent: 5, kitchenStation: 'GENERAL', description: 'Slow-cooked black lentils in buttery gravy' },
        { name: 'Chicken Biryani', price: 320, taxPercent: 5, kitchenStation: 'GENERAL', description: 'Fragrant basmati rice with spiced chicken' },
        { name: 'Veg Biryani', price: 260, taxPercent: 5, kitchenStation: 'GENERAL', description: 'Aromatic rice with mixed vegetables' },
        { name: 'Fish Curry', price: 380, taxPercent: 5, kitchenStation: 'GENERAL', description: 'Fresh fish in coastal-style curry' },
        { name: 'Palak Paneer', price: 280, taxPercent: 5, kitchenStation: 'GENERAL', description: 'Cottage cheese in spinach gravy' },
        { name: 'Chole Bhature', price: 220, taxPercent: 5, kitchenStation: 'FRYER', description: 'Spiced chickpeas with fried bread' },
      ],
    },
    {
      category: { name: 'Breads', sequence: 3 },
      products: [
        { name: 'Butter Naan', price: 60, taxPercent: 5, kitchenStation: 'GRILL', description: 'Soft naan brushed with butter' },
        { name: 'Garlic Naan', price: 70, taxPercent: 5, kitchenStation: 'GRILL', description: 'Naan topped with fresh garlic' },
        { name: 'Tandoori Roti', price: 40, taxPercent: 5, kitchenStation: 'GRILL', description: 'Whole wheat bread from tandoor' },
        { name: 'Cheese Naan', price: 90, taxPercent: 5, kitchenStation: 'GRILL', description: 'Naan stuffed with melted cheese' },
        { name: 'Laccha Paratha', price: 60, taxPercent: 5, kitchenStation: 'GRILL', description: 'Flaky layered paratha' },
      ],
    },
    {
      category: { name: 'Rice', sequence: 4 },
      products: [
        { name: 'Steamed Rice', price: 120, taxPercent: 5, kitchenStation: 'GENERAL', description: 'Plain steamed basmati rice' },
        { name: 'Jeera Rice', price: 150, taxPercent: 5, kitchenStation: 'GENERAL', description: 'Cumin-tempered basmati rice' },
        { name: 'Fried Rice', price: 180, taxPercent: 5, kitchenStation: 'GENERAL', description: 'Stir-fried rice with vegetables' },
      ],
    },
    {
      category: { name: 'Beverages', sequence: 5 },
      products: [
        { name: 'Masala Chai', price: 50, taxPercent: 5, kitchenStation: 'DRINKS', sendToKitchen: false, description: 'Indian spiced tea' },
        { name: 'Coffee', price: 80, taxPercent: 5, kitchenStation: 'DRINKS', sendToKitchen: false, description: 'Freshly brewed coffee' },
        { name: 'Fresh Lime Soda', price: 90, taxPercent: 5, kitchenStation: 'DRINKS', sendToKitchen: false, description: 'Sweet or salted lime soda' },
        { name: 'Mango Lassi', price: 120, taxPercent: 5, kitchenStation: 'DRINKS', sendToKitchen: false, description: 'Sweet mango yogurt drink' },
        { name: 'Buttermilk', price: 60, taxPercent: 5, kitchenStation: 'DRINKS', sendToKitchen: false, description: 'Spiced buttermilk' },
        { name: 'Cold Coffee', price: 130, taxPercent: 5, kitchenStation: 'DRINKS', sendToKitchen: false, description: 'Chilled coffee with ice cream' },
      ],
    },
    {
      category: { name: 'Desserts', sequence: 6 },
      products: [
        { name: 'Gulab Jamun', price: 100, taxPercent: 5, kitchenStation: 'DESSERT', description: 'Deep-fried milk dumplings in sugar syrup' },
        { name: 'Rasmalai', price: 120, taxPercent: 5, kitchenStation: 'DESSERT', description: 'Cottage cheese patties in saffron milk' },
        { name: 'Brownie with Ice Cream', price: 180, taxPercent: 5, kitchenStation: 'DESSERT', description: 'Warm chocolate brownie with vanilla ice cream' },
        { name: 'Kheer', price: 100, taxPercent: 5, kitchenStation: 'DESSERT', description: 'Traditional rice pudding' },
      ],
    },
  ];

  const allProducts = [];

  for (const menu of menuData) {
    let category = await prisma.productCategory.findFirst({ where: { name: menu.category.name } });
    if (!category) {
      category = await prisma.productCategory.create({
        data: { name: menu.category.name, sequence: menu.category.sequence },
      });
    }

    for (const p of menu.products) {
      const existingProduct = await prisma.product.findFirst({
        where: { name: p.name, categoryId: category.id },
      });
      if (!existingProduct) {
        const product = await prisma.product.create({
          data: {
            name: p.name,
            description: p.description || null,
            price: p.price,
            taxPercent: p.taxPercent,
            kitchenStation: p.kitchenStation,
            sendToKitchen: p.sendToKitchen !== undefined ? p.sendToKitchen : true,
            categoryId: category.id,
          },
        });
        allProducts.push(product);
      } else {
        allProducts.push(existingProduct);
      }
    }
    console.log(`   ✓ ${menu.category.name}: ${menu.products.length} products`);
  }
  console.log('');

  // ══════════════════════════════════════════════════════════════════════
  // 6. INGREDIENTS & PRODUCT-INGREDIENT MAPPINGS
  // ══════════════════════════════════════════════════════════════════════
  console.log('🧅 Creating ingredients & stock...');

  const ingredientsData = [
    { name: 'Chicken',            unit: 'kg',  costPerUnit: 250, minStock: 5 },
    { name: 'Paneer',             unit: 'kg',  costPerUnit: 320, minStock: 3 },
    { name: 'Rice (Basmati)',     unit: 'kg',  costPerUnit: 120, minStock: 10 },
    { name: 'Flour (Maida)',      unit: 'kg',  costPerUnit: 45,  minStock: 8 },
    { name: 'Wheat Flour',        unit: 'kg',  costPerUnit: 40,  minStock: 8 },
    { name: 'Butter',             unit: 'kg',  costPerUnit: 500, minStock: 2 },
    { name: 'Oil',                unit: 'l',   costPerUnit: 180, minStock: 5 },
    { name: 'Onions',             unit: 'kg',  costPerUnit: 40,  minStock: 10 },
    { name: 'Tomatoes',           unit: 'kg',  costPerUnit: 50,  minStock: 8 },
    { name: 'Cream',              unit: 'l',   costPerUnit: 250, minStock: 2 },
    { name: 'Spice Mix',          unit: 'kg',  costPerUnit: 600, minStock: 1 },
    { name: 'Fish',               unit: 'kg',  costPerUnit: 450, minStock: 3 },
    { name: 'Mushrooms',          unit: 'kg',  costPerUnit: 200, minStock: 2 },
    { name: 'Lentils (Urad)',     unit: 'kg',  costPerUnit: 150, minStock: 5 },
    { name: 'Chickpeas',          unit: 'kg',  costPerUnit: 100, minStock: 3 },
    { name: 'Spinach',            unit: 'kg',  costPerUnit: 60,  minStock: 3 },
    { name: 'Milk',               unit: 'l',   costPerUnit: 60,  minStock: 10 },
    { name: 'Sugar',              unit: 'kg',  costPerUnit: 45,  minStock: 5 },
    { name: 'Tea Leaves',         unit: 'kg',  costPerUnit: 400, minStock: 1 },
    { name: 'Coffee Powder',      unit: 'kg',  costPerUnit: 700, minStock: 1 },
    { name: 'Mango Pulp',         unit: 'l',   costPerUnit: 200, minStock: 2 },
    { name: 'Yogurt',             unit: 'l',   costPerUnit: 80,  minStock: 5 },
    { name: 'Cheese',             unit: 'kg',  costPerUnit: 400, minStock: 1 },
    { name: 'Chocolate',          unit: 'kg',  costPerUnit: 500, minStock: 1 },
    { name: 'Ice Cream',          unit: 'l',   costPerUnit: 300, minStock: 2 },
    { name: 'Lime',               unit: 'kg',  costPerUnit: 80,  minStock: 2 },
    { name: 'Soda Water',         unit: 'l',   costPerUnit: 25,  minStock: 10 },
    { name: 'Garlic',             unit: 'kg',  costPerUnit: 120, minStock: 2 },
    { name: 'Vegetables (Mixed)', unit: 'kg',  costPerUnit: 80,  minStock: 5 },
  ];

  const ingredientMap = {};
  for (const ing of ingredientsData) {
    let ingredient = await prisma.ingredient.findFirst({ where: { name: ing.name } });
    if (!ingredient) {
      ingredient = await prisma.ingredient.create({
        data: { name: ing.name, unit: ing.unit, costPerUnit: ing.costPerUnit, minStock: ing.minStock },
      });
    }
    ingredientMap[ing.name] = ingredient;

    // Create initial stock (5x the minimum for demo purposes)
    const existingStock = await prisma.inventoryStock.findFirst({ where: { ingredientId: ingredient.id } });
    if (!existingStock) {
      const initialQty = ing.minStock * 5;
      await prisma.inventoryStock.create({
        data: { ingredientId: ingredient.id, quantity: initialQty },
      });
      await prisma.inventoryLedger.create({
        data: {
          ingredientId: ingredient.id,
          changeQty: initialQty,
          balanceAfter: initialQty,
          source: 'PURCHASE',
          notes: 'Initial stock from seed',
          createdBy: admin.id,
        },
      });
    }
  }
  console.log(`   ✓ ${ingredientsData.length} ingredients with stock\n`);

  // ── Product-Ingredient Mappings ─────────────────────────────────────
  console.log('🔗 Linking products to ingredients...');

  const productIngredientMap = {
    'Paneer Tikka':          [{ ingredient: 'Paneer', qty: 0.25 }, { ingredient: 'Spice Mix', qty: 0.02 }, { ingredient: 'Oil', qty: 0.05 }],
    'Chicken Wings':         [{ ingredient: 'Chicken', qty: 0.3 }, { ingredient: 'Oil', qty: 0.1 }, { ingredient: 'Spice Mix', qty: 0.02 }],
    'Veg Spring Rolls':      [{ ingredient: 'Vegetables (Mixed)', qty: 0.15 }, { ingredient: 'Flour (Maida)', qty: 0.05 }, { ingredient: 'Oil', qty: 0.1 }],
    'Fish Fingers':          [{ ingredient: 'Fish', qty: 0.25 }, { ingredient: 'Flour (Maida)', qty: 0.05 }, { ingredient: 'Oil', qty: 0.1 }],
    'Mushroom Soup':         [{ ingredient: 'Mushrooms', qty: 0.15 }, { ingredient: 'Cream', qty: 0.05 }, { ingredient: 'Butter', qty: 0.02 }],
    'Butter Chicken':        [{ ingredient: 'Chicken', qty: 0.3 }, { ingredient: 'Butter', qty: 0.05 }, { ingredient: 'Cream', qty: 0.05 }, { ingredient: 'Tomatoes', qty: 0.1 }, { ingredient: 'Spice Mix', qty: 0.03 }],
    'Paneer Butter Masala':  [{ ingredient: 'Paneer', qty: 0.25 }, { ingredient: 'Butter', qty: 0.04 }, { ingredient: 'Cream', qty: 0.05 }, { ingredient: 'Tomatoes', qty: 0.1 }],
    'Dal Makhani':           [{ ingredient: 'Lentils (Urad)', qty: 0.15 }, { ingredient: 'Butter', qty: 0.04 }, { ingredient: 'Cream', qty: 0.03 }],
    'Chicken Biryani':       [{ ingredient: 'Chicken', qty: 0.25 }, { ingredient: 'Rice (Basmati)', qty: 0.2 }, { ingredient: 'Onions', qty: 0.1 }, { ingredient: 'Spice Mix', qty: 0.03 }],
    'Veg Biryani':           [{ ingredient: 'Vegetables (Mixed)', qty: 0.2 }, { ingredient: 'Rice (Basmati)', qty: 0.2 }, { ingredient: 'Onions', qty: 0.1 }, { ingredient: 'Spice Mix', qty: 0.02 }],
    'Fish Curry':            [{ ingredient: 'Fish', qty: 0.3 }, { ingredient: 'Tomatoes', qty: 0.1 }, { ingredient: 'Onions', qty: 0.08 }, { ingredient: 'Spice Mix', qty: 0.03 }],
    'Palak Paneer':          [{ ingredient: 'Paneer', qty: 0.2 }, { ingredient: 'Spinach', qty: 0.2 }, { ingredient: 'Cream', qty: 0.03 }],
    'Chole Bhature':         [{ ingredient: 'Chickpeas', qty: 0.15 }, { ingredient: 'Flour (Maida)', qty: 0.1 }, { ingredient: 'Oil', qty: 0.1 }],
    'Butter Naan':           [{ ingredient: 'Flour (Maida)', qty: 0.08 }, { ingredient: 'Butter', qty: 0.02 }],
    'Garlic Naan':           [{ ingredient: 'Flour (Maida)', qty: 0.08 }, { ingredient: 'Butter', qty: 0.02 }, { ingredient: 'Garlic', qty: 0.01 }],
    'Tandoori Roti':         [{ ingredient: 'Wheat Flour', qty: 0.08 }],
    'Cheese Naan':           [{ ingredient: 'Flour (Maida)', qty: 0.08 }, { ingredient: 'Cheese', qty: 0.04 }, { ingredient: 'Butter', qty: 0.01 }],
    'Laccha Paratha':        [{ ingredient: 'Wheat Flour', qty: 0.08 }, { ingredient: 'Butter', qty: 0.03 }],
    'Steamed Rice':          [{ ingredient: 'Rice (Basmati)', qty: 0.15 }],
    'Jeera Rice':            [{ ingredient: 'Rice (Basmati)', qty: 0.15 }, { ingredient: 'Butter', qty: 0.01 }, { ingredient: 'Spice Mix', qty: 0.005 }],
    'Fried Rice':            [{ ingredient: 'Rice (Basmati)', qty: 0.15 }, { ingredient: 'Vegetables (Mixed)', qty: 0.1 }, { ingredient: 'Oil', qty: 0.03 }],
    'Masala Chai':           [{ ingredient: 'Tea Leaves', qty: 0.005 }, { ingredient: 'Milk', qty: 0.15 }, { ingredient: 'Sugar', qty: 0.015 }],
    'Coffee':                [{ ingredient: 'Coffee Powder', qty: 0.01 }, { ingredient: 'Milk', qty: 0.15 }, { ingredient: 'Sugar', qty: 0.015 }],
    'Fresh Lime Soda':       [{ ingredient: 'Lime', qty: 0.03 }, { ingredient: 'Soda Water', qty: 0.25 }, { ingredient: 'Sugar', qty: 0.02 }],
    'Mango Lassi':           [{ ingredient: 'Mango Pulp', qty: 0.1 }, { ingredient: 'Yogurt', qty: 0.15 }, { ingredient: 'Sugar', qty: 0.02 }],
    'Buttermilk':            [{ ingredient: 'Yogurt', qty: 0.2 }, { ingredient: 'Spice Mix', qty: 0.003 }],
    'Cold Coffee':           [{ ingredient: 'Coffee Powder', qty: 0.01 }, { ingredient: 'Milk', qty: 0.15 }, { ingredient: 'Ice Cream', qty: 0.05 }, { ingredient: 'Sugar', qty: 0.02 }],
    'Gulab Jamun':           [{ ingredient: 'Milk', qty: 0.1 }, { ingredient: 'Sugar', qty: 0.05 }, { ingredient: 'Oil', qty: 0.05 }],
    'Rasmalai':              [{ ingredient: 'Milk', qty: 0.2 }, { ingredient: 'Sugar', qty: 0.04 }],
    'Brownie with Ice Cream':[{ ingredient: 'Chocolate', qty: 0.06 }, { ingredient: 'Flour (Maida)', qty: 0.04 }, { ingredient: 'Butter', qty: 0.03 }, { ingredient: 'Ice Cream', qty: 0.08 }],
    'Kheer':                 [{ ingredient: 'Rice (Basmati)', qty: 0.05 }, { ingredient: 'Milk', qty: 0.25 }, { ingredient: 'Sugar', qty: 0.04 }],
  };

  let linkCount = 0;
  for (const product of allProducts) {
    const mappings = productIngredientMap[product.name];
    if (!mappings) continue;

    for (const m of mappings) {
      const ingredient = ingredientMap[m.ingredient];
      if (!ingredient) continue;

      const exists = await prisma.productIngredient.findFirst({
        where: { productId: product.id, ingredientId: ingredient.id },
      });
      if (!exists) {
        await prisma.productIngredient.create({
          data: { productId: product.id, ingredientId: ingredient.id, quantity: m.qty },
        });
        linkCount++;
      }
    }
  }
  console.log(`   ✓ ${linkCount} product-ingredient links created\n`);

  // ══════════════════════════════════════════════════════════════════════
  // DONE
  // ══════════════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════');
  console.log('✅ Database seeded successfully!');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('Login credentials (all use password: password123):');
  console.log('  Admin:   admin@restaurant.com');
  console.log('  Cashier: cashier@restaurant.com');
  console.log('  Kitchen: kitchen@restaurant.com');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });