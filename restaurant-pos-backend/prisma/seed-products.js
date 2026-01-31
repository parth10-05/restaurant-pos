import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed realistic restaurant products
 * Covers all default categories with varied pricing and configurations
 */

const productsData = {
  'Starters': [
    {
      name: 'Paneer Tikka',
      description: 'Grilled cottage cheese marinated in Indian spices',
      price: 280.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Chicken 65',
      description: 'Spicy deep-fried chicken chunks with curry leaves',
      price: 320.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Vegetable Spring Rolls',
      description: 'Crispy rolls filled with mixed vegetables',
      price: 220.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Fish Finger',
      description: 'Crispy breaded fish strips with tartar sauce',
      price: 340.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Mushroom Soup',
      description: 'Creamy soup with fresh mushrooms and herbs',
      price: 180.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Corn Cheese Balls',
      description: 'Deep-fried corn and cheese croquettes',
      price: 240.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Chicken Wings',
      description: 'Spicy buffalo wings with ranch dip',
      price: 360.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Veg Manchurian',
      description: 'Indo-Chinese vegetable balls in tangy sauce',
      price: 260.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
  ],

  'Main Course': [
    {
      name: 'Butter Chicken',
      description: 'Tender chicken in rich tomato and butter gravy',
      price: 420.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Paneer Butter Masala',
      description: 'Cottage cheese cubes in creamy tomato gravy',
      price: 380.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Chicken Biryani',
      description: 'Aromatic basmati rice with spiced chicken',
      price: 450.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Veg Biryani',
      description: 'Fragrant rice with mixed vegetables and spices',
      price: 350.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Dal Makhani',
      description: 'Creamy black lentils slow-cooked overnight',
      price: 280.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Kadai Paneer',
      description: 'Cottage cheese with bell peppers in spicy gravy',
      price: 360.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Fish Curry',
      description: 'Fresh fish cooked in coastal-style curry',
      price: 480.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Mutton Rogan Josh',
      description: 'Tender mutton in aromatic Kashmiri gravy',
      price: 520.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Veg Hakka Noodles',
      description: 'Stir-fried noodles with vegetables',
      price: 280.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Chicken Fried Rice',
      description: 'Wok-tossed rice with chicken and vegetables',
      price: 320.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Palak Paneer',
      description: 'Cottage cheese in spinach gravy',
      price: 340.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Chicken Tandoori',
      description: 'Clay oven roasted chicken with spices',
      price: 440.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Naan Bread',
      description: 'Freshly baked leavened bread',
      price: 50.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Garlic Naan',
      description: 'Naan topped with butter and garlic',
      price: 70.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Butter Naan',
      description: 'Naan brushed with melted butter',
      price: 60.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
  ],

  'Desserts': [
    {
      name: 'Gulab Jamun',
      description: 'Fried milk dumplings in sugar syrup (2 pcs)',
      price: 120.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Chocolate Brownie',
      description: 'Warm chocolate brownie with vanilla ice cream',
      price: 180.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Rasmalai',
      description: 'Cottage cheese patties in sweetened milk (2 pcs)',
      price: 140.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Ice Cream Sundae',
      description: 'Triple scoop ice cream with chocolate sauce',
      price: 160.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Tiramisu',
      description: 'Classic Italian coffee-flavored dessert',
      price: 220.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Kulfi',
      description: 'Traditional Indian ice cream (Mango/Pistachio)',
      price: 100.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Cheesecake',
      description: 'New York style cheesecake with berry compote',
      price: 240.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
    {
      name: 'Gajar Halwa',
      description: 'Carrot pudding with nuts and cardamom',
      price: 130.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: true,
    },
  ],

  'Beverages': [
    {
      name: 'Fresh Lime Soda',
      description: 'Refreshing lime juice with soda water',
      price: 80.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: false, // Beverages typically don't go to kitchen
    },
    {
      name: 'Mango Lassi',
      description: 'Chilled yogurt drink with mango pulp',
      price: 120.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: false,
    },
    {
      name: 'Masala Chai',
      description: 'Traditional Indian spiced tea',
      price: 60.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: false,
    },
    {
      name: 'Coffee',
      description: 'Freshly brewed filter coffee',
      price: 80.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: false,
    },
    {
      name: 'Coca Cola',
      description: 'Chilled soft drink (300ml)',
      price: 60.00,
      taxPercent: 12.0, // Higher tax for packaged beverages
      isActive: true,
      sendToKitchen: false,
    },
    {
      name: 'Mineral Water',
      description: 'Packaged drinking water (1L)',
      price: 40.00,
      taxPercent: 18.0, // GST on packaged water
      isActive: true,
      sendToKitchen: false,
    },
    {
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed orange juice',
      price: 140.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: false,
    },
    {
      name: 'Sweet Lassi',
      description: 'Traditional sweetened yogurt drink',
      price: 100.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: false,
    },
    {
      name: 'Iced Tea',
      description: 'Chilled lemon iced tea',
      price: 90.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: false,
    },
    {
      name: 'Mojito (Virgin)',
      description: 'Non-alcoholic mint and lime mocktail',
      price: 150.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: false,
    },
    {
      name: 'Hot Chocolate',
      description: 'Rich hot chocolate with whipped cream',
      price: 120.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: false,
    },
    {
      name: 'Green Tea',
      description: 'Premium green tea',
      price: 70.00,
      taxPercent: 5.0,
      isActive: true,
      sendToKitchen: false,
    },
  ],
};

async function seedProducts() {
  console.log('Starting product seed...\n');

  try {
    // Fetch all categories
    const categories = await prisma.productCategory.findMany({
      orderBy: { sequence: 'asc' },
    });

    if (categories.length === 0) {
      console.error('❌ No categories found. Please run seed-categories.js first.');
      process.exit(1);
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const category of categories) {
      const categoryProducts = productsData[category.name];

      if (!categoryProducts) {
        console.log(`⚠️  No products defined for category: ${category.name}`);
        continue;
      }

      console.log(`📦 Seeding products for: ${category.name}`);

      for (const productData of categoryProducts) {
        // Check if product already exists
        const existing = await prisma.product.findFirst({
          where: {
            name: productData.name,
            categoryId: category.id,
          },
        });

        if (existing) {
          console.log(`   - Skipped (exists): ${productData.name}`);
          totalSkipped++;
          continue;
        }

        // Create product
        await prisma.product.create({
          data: {
            ...productData,
            categoryId: category.id,
          },
        });

        console.log(`   ✓ Created: ${productData.name} - ₹${productData.price}`);
        totalCreated++;
      }

      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Product seeding completed!`);
    console.log(`   Created: ${totalCreated} products`);
    console.log(`   Skipped: ${totalSkipped} products (already exist)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Display summary by category
    console.log('📊 Product Summary by Category:');
    for (const category of categories) {
      const count = await prisma.product.count({
        where: { categoryId: category.id },
      });
      console.log(`   ${category.name}: ${count} products`);
    }

  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
}

seedProducts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });