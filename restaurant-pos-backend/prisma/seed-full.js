import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

/**
 * Complete Database Seed
 * Creates: Users, Categories, Products, Ingredients, ProductIngredients, Floors, Tables, Stock, Orders
 */

// ============================================
// USERS DATA
// ============================================
const usersData = [
  { email: 'admin@restaurant.com', password: 'password123', role: 'admin' },
  { email: 'cashier@restaurant.com', password: 'password123', role: 'cashier' },
  { email: 'kitchen@restaurant.com', password: 'password123', role: 'kitchen' },
];

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
// INGREDIENTS DATA
// ============================================
const ingredientsData = [
  // Proteins
  { name: 'Chicken Breast', unit: 'kg', costPerUnit: 280, minStock: 5 },
  { name: 'Chicken Thigh', unit: 'kg', costPerUnit: 240, minStock: 3 },
  { name: 'Mutton', unit: 'kg', costPerUnit: 650, minStock: 3 },
  { name: 'Fish Fillet', unit: 'kg', costPerUnit: 450, minStock: 2 },
  { name: 'Paneer', unit: 'kg', costPerUnit: 320, minStock: 3 },
  { name: 'Eggs', unit: 'pcs', costPerUnit: 8, minStock: 50 },
  
  // Dairy
  { name: 'Butter', unit: 'kg', costPerUnit: 480, minStock: 2 },
  { name: 'Cream', unit: 'l', costPerUnit: 280, minStock: 2 },
  { name: 'Milk', unit: 'l', costPerUnit: 60, minStock: 10 },
  { name: 'Yogurt', unit: 'kg', costPerUnit: 80, minStock: 3 },
  { name: 'Cheese', unit: 'kg', costPerUnit: 550, minStock: 1 },
  
  // Vegetables
  { name: 'Onion', unit: 'kg', costPerUnit: 40, minStock: 10 },
  { name: 'Tomato', unit: 'kg', costPerUnit: 50, minStock: 8 },
  { name: 'Spinach', unit: 'kg', costPerUnit: 60, minStock: 2 },
  { name: 'Capsicum', unit: 'kg', costPerUnit: 100, minStock: 2 },
  { name: 'Potato', unit: 'kg', costPerUnit: 30, minStock: 10 },
  { name: 'Carrot', unit: 'kg', costPerUnit: 45, minStock: 3 },
  { name: 'Mushroom', unit: 'kg', costPerUnit: 200, minStock: 1 },
  { name: 'Ginger', unit: 'kg', costPerUnit: 150, minStock: 1 },
  { name: 'Garlic', unit: 'kg', costPerUnit: 180, minStock: 1 },
  { name: 'Green Chili', unit: 'kg', costPerUnit: 80, minStock: 0.5 },
  { name: 'Coriander', unit: 'kg', costPerUnit: 100, minStock: 0.5 },
  { name: 'Mint', unit: 'kg', costPerUnit: 120, minStock: 0.3 },
  { name: 'Corn', unit: 'kg', costPerUnit: 70, minStock: 2 },
  
  // Grains & Flour
  { name: 'Basmati Rice', unit: 'kg', costPerUnit: 120, minStock: 10 },
  { name: 'All Purpose Flour', unit: 'kg', costPerUnit: 50, minStock: 5 },
  { name: 'Noodles', unit: 'kg', costPerUnit: 80, minStock: 3 },
  { name: 'Bread', unit: 'pcs', costPerUnit: 40, minStock: 10 },
  { name: 'Black Lentils', unit: 'kg', costPerUnit: 150, minStock: 3 },
  
  // Spices & Condiments
  { name: 'Garam Masala', unit: 'kg', costPerUnit: 400, minStock: 0.5 },
  { name: 'Turmeric', unit: 'kg', costPerUnit: 200, minStock: 0.5 },
  { name: 'Red Chili Powder', unit: 'kg', costPerUnit: 300, minStock: 0.5 },
  { name: 'Cumin', unit: 'kg', costPerUnit: 350, minStock: 0.5 },
  { name: 'Cooking Oil', unit: 'l', costPerUnit: 150, minStock: 5 },
  { name: 'Salt', unit: 'kg', costPerUnit: 25, minStock: 2 },
  { name: 'Sugar', unit: 'kg', costPerUnit: 50, minStock: 3 },
  { name: 'Soy Sauce', unit: 'l', costPerUnit: 180, minStock: 1 },
  
  // Dessert Ingredients
  { name: 'Chocolate', unit: 'kg', costPerUnit: 600, minStock: 1 },
  { name: 'Ice Cream', unit: 'l', costPerUnit: 250, minStock: 3 },
  { name: 'Mango Pulp', unit: 'l', costPerUnit: 180, minStock: 2 },
  { name: 'Coffee Powder', unit: 'kg', costPerUnit: 500, minStock: 0.5 },
  { name: 'Tea Leaves', unit: 'kg', costPerUnit: 400, minStock: 0.5 },
  
  // Beverages
  { name: 'Lemon', unit: 'kg', costPerUnit: 80, minStock: 2 },
  { name: 'Orange', unit: 'kg', costPerUnit: 100, minStock: 2 },
  { name: 'Soda Water', unit: 'l', costPerUnit: 30, minStock: 5 },
  { name: 'Coca Cola', unit: 'pcs', costPerUnit: 35, minStock: 20 },
  { name: 'Mineral Water', unit: 'pcs', costPerUnit: 15, minStock: 30 },
];

// ============================================
// PRODUCTS DATA (with kitchen stations)
// ============================================
const productsData = {
  'Starters': [
    { name: 'Paneer Tikka', description: 'Grilled cottage cheese marinated in Indian spices', price: 280.00, taxPercent: 5.0, kitchenStation: 'GRILL' },
    { name: 'Chicken 65', description: 'Spicy deep-fried chicken chunks with curry leaves', price: 320.00, taxPercent: 5.0, kitchenStation: 'FRYER' },
    { name: 'Vegetable Spring Rolls', description: 'Crispy rolls filled with mixed vegetables', price: 220.00, taxPercent: 5.0, kitchenStation: 'FRYER' },
    { name: 'Fish Finger', description: 'Crispy breaded fish strips with tartar sauce', price: 340.00, taxPercent: 5.0, kitchenStation: 'FRYER' },
    { name: 'Mushroom Soup', description: 'Creamy soup with fresh mushrooms and herbs', price: 180.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
    { name: 'Corn Cheese Balls', description: 'Deep-fried corn and cheese croquettes', price: 240.00, taxPercent: 5.0, kitchenStation: 'FRYER' },
    { name: 'Chicken Wings', description: 'Spicy buffalo wings with ranch dip', price: 360.00, taxPercent: 5.0, kitchenStation: 'FRYER' },
    { name: 'Veg Manchurian', description: 'Indo-Chinese vegetable balls in tangy sauce', price: 260.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
  ],
  'Main Course': [
    { name: 'Butter Chicken', description: 'Tender chicken in rich tomato and butter gravy', price: 420.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
    { name: 'Paneer Butter Masala', description: 'Cottage cheese cubes in creamy tomato gravy', price: 380.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
    { name: 'Chicken Biryani', description: 'Aromatic basmati rice with spiced chicken', price: 450.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
    { name: 'Veg Biryani', description: 'Fragrant rice with mixed vegetables and spices', price: 350.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
    { name: 'Dal Makhani', description: 'Creamy black lentils slow-cooked overnight', price: 280.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
    { name: 'Kadai Paneer', description: 'Cottage cheese with bell peppers in spicy gravy', price: 360.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
    { name: 'Fish Curry', description: 'Fresh fish cooked in coastal-style curry', price: 480.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
    { name: 'Mutton Rogan Josh', description: 'Tender mutton in aromatic Kashmiri gravy', price: 520.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
    { name: 'Veg Hakka Noodles', description: 'Stir-fried noodles with vegetables', price: 280.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
    { name: 'Chicken Fried Rice', description: 'Wok-tossed rice with chicken and vegetables', price: 320.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
    { name: 'Palak Paneer', description: 'Cottage cheese in spinach gravy', price: 340.00, taxPercent: 5.0, kitchenStation: 'GENERAL' },
    { name: 'Chicken Tandoori', description: 'Clay oven roasted chicken with spices', price: 440.00, taxPercent: 5.0, kitchenStation: 'GRILL' },
    { name: 'Naan Bread', description: 'Freshly baked leavened bread', price: 50.00, taxPercent: 5.0, kitchenStation: 'GRILL' },
    { name: 'Garlic Naan', description: 'Naan topped with butter and garlic', price: 70.00, taxPercent: 5.0, kitchenStation: 'GRILL' },
    { name: 'Butter Roti', description: 'Fresh wheat bread brushed with butter', price: 40.00, taxPercent: 5.0, kitchenStation: 'GRILL' },
  ],
  'Desserts': [
    { name: 'Gulab Jamun', description: 'Fried milk dumplings in sugar syrup (2 pcs)', price: 120.00, taxPercent: 5.0, kitchenStation: 'DESSERT' },
    { name: 'Chocolate Brownie', description: 'Warm chocolate brownie with vanilla ice cream', price: 180.00, taxPercent: 5.0, kitchenStation: 'DESSERT' },
    { name: 'Rasmalai', description: 'Cottage cheese patties in sweetened milk (2 pcs)', price: 140.00, taxPercent: 5.0, kitchenStation: 'DESSERT' },
    { name: 'Ice Cream Sundae', description: 'Triple scoop ice cream with chocolate sauce', price: 160.00, taxPercent: 5.0, kitchenStation: 'DESSERT' },
    { name: 'Gajar Halwa', description: 'Carrot pudding with nuts and cardamom', price: 130.00, taxPercent: 5.0, kitchenStation: 'DESSERT' },
  ],
  'Beverages': [
    { name: 'Fresh Lime Soda', description: 'Refreshing lime juice with soda water', price: 80.00, taxPercent: 5.0, kitchenStation: 'DRINKS', sendToKitchen: false },
    { name: 'Mango Lassi', description: 'Chilled yogurt drink with mango pulp', price: 120.00, taxPercent: 5.0, kitchenStation: 'DRINKS', sendToKitchen: false },
    { name: 'Masala Chai', description: 'Traditional Indian spiced tea', price: 60.00, taxPercent: 5.0, kitchenStation: 'DRINKS', sendToKitchen: false },
    { name: 'Coffee', description: 'Freshly brewed filter coffee', price: 80.00, taxPercent: 5.0, kitchenStation: 'DRINKS', sendToKitchen: false },
    { name: 'Coca Cola', description: 'Chilled soft drink (300ml)', price: 60.00, taxPercent: 12.0, kitchenStation: 'DRINKS', sendToKitchen: false },
    { name: 'Mineral Water', description: 'Packaged drinking water (1L)', price: 40.00, taxPercent: 18.0, kitchenStation: 'DRINKS', sendToKitchen: false },
    { name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice', price: 140.00, taxPercent: 5.0, kitchenStation: 'DRINKS', sendToKitchen: false },
    { name: 'Sweet Lassi', description: 'Traditional sweetened yogurt drink', price: 100.00, taxPercent: 5.0, kitchenStation: 'DRINKS', sendToKitchen: false },
  ],
};

// ============================================
// PRODUCT INGREDIENTS (what ingredients each product uses)
// ============================================
const productIngredientsMap = {
  // Starters
  'Paneer Tikka': [
    { ingredient: 'Paneer', quantity: 0.15 },
    { ingredient: 'Yogurt', quantity: 0.03 },
    { ingredient: 'Capsicum', quantity: 0.05 },
    { ingredient: 'Onion', quantity: 0.03 },
    { ingredient: 'Cooking Oil', quantity: 0.02 },
    { ingredient: 'Garam Masala', quantity: 0.005 },
  ],
  'Chicken 65': [
    { ingredient: 'Chicken Breast', quantity: 0.15 },
    { ingredient: 'All Purpose Flour', quantity: 0.03 },
    { ingredient: 'Eggs', quantity: 1 },
    { ingredient: 'Cooking Oil', quantity: 0.1 },
    { ingredient: 'Red Chili Powder', quantity: 0.005 },
    { ingredient: 'Garlic', quantity: 0.01 },
  ],
  'Vegetable Spring Rolls': [
    { ingredient: 'All Purpose Flour', quantity: 0.05 },
    { ingredient: 'Carrot', quantity: 0.03 },
    { ingredient: 'Capsicum', quantity: 0.03 },
    { ingredient: 'Onion', quantity: 0.02 },
    { ingredient: 'Cooking Oil', quantity: 0.08 },
    { ingredient: 'Soy Sauce', quantity: 0.01 },
  ],
  'Fish Finger': [
    { ingredient: 'Fish Fillet', quantity: 0.15 },
    { ingredient: 'All Purpose Flour', quantity: 0.03 },
    { ingredient: 'Eggs', quantity: 1 },
    { ingredient: 'Bread', quantity: 1 },
    { ingredient: 'Cooking Oil', quantity: 0.1 },
  ],
  'Mushroom Soup': [
    { ingredient: 'Mushroom', quantity: 0.1 },
    { ingredient: 'Cream', quantity: 0.05 },
    { ingredient: 'Butter', quantity: 0.02 },
    { ingredient: 'All Purpose Flour', quantity: 0.01 },
    { ingredient: 'Onion', quantity: 0.03 },
  ],
  'Corn Cheese Balls': [
    { ingredient: 'Corn', quantity: 0.08 },
    { ingredient: 'Cheese', quantity: 0.05 },
    { ingredient: 'All Purpose Flour', quantity: 0.03 },
    { ingredient: 'Cooking Oil', quantity: 0.08 },
  ],
  'Chicken Wings': [
    { ingredient: 'Chicken Thigh', quantity: 0.2 },
    { ingredient: 'Cooking Oil', quantity: 0.1 },
    { ingredient: 'Red Chili Powder', quantity: 0.005 },
    { ingredient: 'Butter', quantity: 0.02 },
  ],
  'Veg Manchurian': [
    { ingredient: 'Carrot', quantity: 0.03 },
    { ingredient: 'Capsicum', quantity: 0.03 },
    { ingredient: 'Onion', quantity: 0.03 },
    { ingredient: 'All Purpose Flour', quantity: 0.03 },
    { ingredient: 'Soy Sauce', quantity: 0.02 },
    { ingredient: 'Cooking Oil', quantity: 0.08 },
  ],
  
  // Main Course
  'Butter Chicken': [
    { ingredient: 'Chicken Breast', quantity: 0.2 },
    { ingredient: 'Butter', quantity: 0.05 },
    { ingredient: 'Cream', quantity: 0.05 },
    { ingredient: 'Tomato', quantity: 0.1 },
    { ingredient: 'Onion', quantity: 0.05 },
    { ingredient: 'Garam Masala', quantity: 0.005 },
    { ingredient: 'Ginger', quantity: 0.01 },
    { ingredient: 'Garlic', quantity: 0.01 },
  ],
  'Paneer Butter Masala': [
    { ingredient: 'Paneer', quantity: 0.2 },
    { ingredient: 'Butter', quantity: 0.05 },
    { ingredient: 'Cream', quantity: 0.05 },
    { ingredient: 'Tomato', quantity: 0.1 },
    { ingredient: 'Onion', quantity: 0.05 },
    { ingredient: 'Garam Masala', quantity: 0.005 },
  ],
  'Chicken Biryani': [
    { ingredient: 'Chicken Breast', quantity: 0.2 },
    { ingredient: 'Basmati Rice', quantity: 0.15 },
    { ingredient: 'Onion', quantity: 0.08 },
    { ingredient: 'Yogurt', quantity: 0.03 },
    { ingredient: 'Garam Masala', quantity: 0.005 },
    { ingredient: 'Cooking Oil', quantity: 0.03 },
    { ingredient: 'Mint', quantity: 0.01 },
    { ingredient: 'Coriander', quantity: 0.01 },
  ],
  'Veg Biryani': [
    { ingredient: 'Basmati Rice', quantity: 0.15 },
    { ingredient: 'Carrot', quantity: 0.05 },
    { ingredient: 'Potato', quantity: 0.05 },
    { ingredient: 'Capsicum', quantity: 0.03 },
    { ingredient: 'Onion', quantity: 0.08 },
    { ingredient: 'Yogurt', quantity: 0.03 },
    { ingredient: 'Garam Masala', quantity: 0.005 },
    { ingredient: 'Cooking Oil', quantity: 0.03 },
  ],
  'Dal Makhani': [
    { ingredient: 'Black Lentils', quantity: 0.1 },
    { ingredient: 'Butter', quantity: 0.04 },
    { ingredient: 'Cream', quantity: 0.03 },
    { ingredient: 'Tomato', quantity: 0.05 },
    { ingredient: 'Onion', quantity: 0.03 },
    { ingredient: 'Ginger', quantity: 0.01 },
    { ingredient: 'Garlic', quantity: 0.01 },
  ],
  'Kadai Paneer': [
    { ingredient: 'Paneer', quantity: 0.2 },
    { ingredient: 'Capsicum', quantity: 0.08 },
    { ingredient: 'Tomato', quantity: 0.08 },
    { ingredient: 'Onion', quantity: 0.05 },
    { ingredient: 'Cooking Oil', quantity: 0.03 },
    { ingredient: 'Garam Masala', quantity: 0.005 },
  ],
  'Fish Curry': [
    { ingredient: 'Fish Fillet', quantity: 0.25 },
    { ingredient: 'Tomato', quantity: 0.08 },
    { ingredient: 'Onion', quantity: 0.05 },
    { ingredient: 'Cooking Oil', quantity: 0.03 },
    { ingredient: 'Turmeric', quantity: 0.003 },
    { ingredient: 'Red Chili Powder', quantity: 0.005 },
  ],
  'Mutton Rogan Josh': [
    { ingredient: 'Mutton', quantity: 0.25 },
    { ingredient: 'Yogurt', quantity: 0.05 },
    { ingredient: 'Onion', quantity: 0.08 },
    { ingredient: 'Tomato', quantity: 0.05 },
    { ingredient: 'Garam Masala', quantity: 0.008 },
    { ingredient: 'Cooking Oil', quantity: 0.04 },
  ],
  'Veg Hakka Noodles': [
    { ingredient: 'Noodles', quantity: 0.15 },
    { ingredient: 'Carrot', quantity: 0.03 },
    { ingredient: 'Capsicum', quantity: 0.03 },
    { ingredient: 'Onion', quantity: 0.03 },
    { ingredient: 'Soy Sauce', quantity: 0.02 },
    { ingredient: 'Cooking Oil', quantity: 0.03 },
  ],
  'Chicken Fried Rice': [
    { ingredient: 'Chicken Breast', quantity: 0.1 },
    { ingredient: 'Basmati Rice', quantity: 0.15 },
    { ingredient: 'Eggs', quantity: 1 },
    { ingredient: 'Carrot', quantity: 0.02 },
    { ingredient: 'Onion', quantity: 0.03 },
    { ingredient: 'Soy Sauce', quantity: 0.02 },
    { ingredient: 'Cooking Oil', quantity: 0.03 },
  ],
  'Palak Paneer': [
    { ingredient: 'Paneer', quantity: 0.2 },
    { ingredient: 'Spinach', quantity: 0.15 },
    { ingredient: 'Onion', quantity: 0.03 },
    { ingredient: 'Cream', quantity: 0.02 },
    { ingredient: 'Garlic', quantity: 0.01 },
    { ingredient: 'Cooking Oil', quantity: 0.02 },
  ],
  'Chicken Tandoori': [
    { ingredient: 'Chicken Thigh', quantity: 0.3 },
    { ingredient: 'Yogurt', quantity: 0.05 },
    { ingredient: 'Garam Masala', quantity: 0.005 },
    { ingredient: 'Red Chili Powder', quantity: 0.005 },
    { ingredient: 'Cooking Oil', quantity: 0.02 },
  ],
  'Naan Bread': [
    { ingredient: 'All Purpose Flour', quantity: 0.08 },
    { ingredient: 'Yogurt', quantity: 0.02 },
    { ingredient: 'Butter', quantity: 0.01 },
  ],
  'Garlic Naan': [
    { ingredient: 'All Purpose Flour', quantity: 0.08 },
    { ingredient: 'Yogurt', quantity: 0.02 },
    { ingredient: 'Butter', quantity: 0.02 },
    { ingredient: 'Garlic', quantity: 0.01 },
  ],
  'Butter Roti': [
    { ingredient: 'All Purpose Flour', quantity: 0.05 },
    { ingredient: 'Butter', quantity: 0.01 },
  ],
  
  // Desserts
  'Gulab Jamun': [
    { ingredient: 'Milk', quantity: 0.1 },
    { ingredient: 'All Purpose Flour', quantity: 0.03 },
    { ingredient: 'Sugar', quantity: 0.05 },
    { ingredient: 'Cooking Oil', quantity: 0.05 },
  ],
  'Chocolate Brownie': [
    { ingredient: 'Chocolate', quantity: 0.08 },
    { ingredient: 'All Purpose Flour', quantity: 0.05 },
    { ingredient: 'Butter', quantity: 0.04 },
    { ingredient: 'Sugar', quantity: 0.03 },
    { ingredient: 'Eggs', quantity: 1 },
    { ingredient: 'Ice Cream', quantity: 0.05 },
  ],
  'Rasmalai': [
    { ingredient: 'Paneer', quantity: 0.1 },
    { ingredient: 'Milk', quantity: 0.15 },
    { ingredient: 'Sugar', quantity: 0.04 },
  ],
  'Ice Cream Sundae': [
    { ingredient: 'Ice Cream', quantity: 0.15 },
    { ingredient: 'Chocolate', quantity: 0.02 },
  ],
  'Gajar Halwa': [
    { ingredient: 'Carrot', quantity: 0.15 },
    { ingredient: 'Milk', quantity: 0.1 },
    { ingredient: 'Sugar', quantity: 0.04 },
    { ingredient: 'Butter', quantity: 0.02 },
  ],
  
  // Beverages
  'Fresh Lime Soda': [
    { ingredient: 'Lemon', quantity: 0.05 },
    { ingredient: 'Soda Water', quantity: 0.25 },
    { ingredient: 'Sugar', quantity: 0.02 },
  ],
  'Mango Lassi': [
    { ingredient: 'Yogurt', quantity: 0.15 },
    { ingredient: 'Mango Pulp', quantity: 0.1 },
    { ingredient: 'Sugar', quantity: 0.02 },
  ],
  'Masala Chai': [
    { ingredient: 'Tea Leaves', quantity: 0.005 },
    { ingredient: 'Milk', quantity: 0.15 },
    { ingredient: 'Sugar', quantity: 0.015 },
    { ingredient: 'Ginger', quantity: 0.003 },
  ],
  'Coffee': [
    { ingredient: 'Coffee Powder', quantity: 0.008 },
    { ingredient: 'Milk', quantity: 0.15 },
    { ingredient: 'Sugar', quantity: 0.015 },
  ],
  'Coca Cola': [
    { ingredient: 'Coca Cola', quantity: 1 },
  ],
  'Mineral Water': [
    { ingredient: 'Mineral Water', quantity: 1 },
  ],
  'Fresh Orange Juice': [
    { ingredient: 'Orange', quantity: 0.3 },
    { ingredient: 'Sugar', quantity: 0.01 },
  ],
  'Sweet Lassi': [
    { ingredient: 'Yogurt', quantity: 0.2 },
    { ingredient: 'Sugar', quantity: 0.03 },
  ],
};

// ============================================
// FLOORS DATA
// ============================================
const floorsData = [
  {
    name: 'Ground Floor',
    sequence: 1,
    tables: [
      { number: 1, seats: 2 }, { number: 2, seats: 2 }, { number: 3, seats: 4 },
      { number: 4, seats: 4 }, { number: 5, seats: 4 }, { number: 6, seats: 6 },
      { number: 7, seats: 6 }, { number: 8, seats: 8 },
    ],
  },
  {
    name: 'First Floor',
    sequence: 2,
    tables: [
      { number: 9, seats: 4 }, { number: 10, seats: 4 }, { number: 11, seats: 6 },
      { number: 12, seats: 6 }, { number: 13, seats: 8 }, { number: 14, seats: 10 },
    ],
  },
  {
    name: 'Rooftop',
    sequence: 3,
    tables: [
      { number: 15, seats: 4 }, { number: 16, seats: 4 }, { number: 17, seats: 6 },
      { number: 18, seats: 6 },
    ],
  },
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  
  // Delete in order of dependencies
  await prisma.inventoryLedger.deleteMany();
  await prisma.wasteEvent.deleteMany();
  await prisma.inventoryStock.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.kitchenTicket.deleteMany();
  await prisma.order.deleteMany();
  await prisma.pOS_Session.deleteMany();
  await prisma.productIngredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.table.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.posConfig.deleteMany();
  await prisma.receiptSettings.deleteMany();
  
  console.log('✅ Database cleared');
}

async function seedUsers() {
  console.log('👤 Seeding users...');
  
  const users = [];
  for (const userData of usersData) {
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      },
    });
    users.push(user);
    console.log(`   Created user: ${user.email} (${user.role})`);
  }
  
  return users;
}

async function seedCategories() {
  console.log('📁 Seeding categories...');
  
  const categories = {};
  for (const catData of categoriesData) {
    const category = await prisma.productCategory.create({
      data: catData,
    });
    categories[category.name] = category;
    console.log(`   Created category: ${category.name}`);
  }
  
  return categories;
}

async function seedIngredients() {
  console.log('🥬 Seeding ingredients...');
  
  const ingredients = {};
  for (const ingData of ingredientsData) {
    const ingredient = await prisma.ingredient.create({
      data: ingData,
    });
    ingredients[ingredient.name] = ingredient;
  }
  console.log(`   Created ${Object.keys(ingredients).length} ingredients`);
  
  return ingredients;
}

async function seedProducts(categories, ingredients) {
  console.log('🍽️  Seeding products...');
  
  const products = {};
  
  for (const [categoryName, productsInCategory] of Object.entries(productsData)) {
    const category = categories[categoryName];
    
    for (const productData of productsInCategory) {
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          taxPercent: productData.taxPercent,
          kitchenStation: productData.kitchenStation || 'GENERAL',
          sendToKitchen: productData.sendToKitchen !== false,
          categoryId: category.id,
        },
      });
      products[product.name] = product;
    }
    console.log(`   Created ${productsInCategory.length} products in ${categoryName}`);
  }
  
  // Create product-ingredient relationships
  console.log('🔗 Creating product-ingredient relationships...');
  for (const [productName, ingredientsList] of Object.entries(productIngredientsMap)) {
    const product = products[productName];
    if (!product) {
      console.log(`   ⚠️  Product not found: ${productName}`);
      continue;
    }
    
    for (const ingMapping of ingredientsList) {
      const ingredient = ingredients[ingMapping.ingredient];
      if (!ingredient) {
        console.log(`   ⚠️  Ingredient not found: ${ingMapping.ingredient}`);
        continue;
      }
      
      await prisma.productIngredient.create({
        data: {
          productId: product.id,
          ingredientId: ingredient.id,
          quantity: ingMapping.quantity,
        },
      });
    }
  }
  console.log('   ✅ Product-ingredient relationships created');
  
  return products;
}

async function seedFloorsAndTables() {
  console.log('🏢 Seeding floors and tables...');
  
  const tables = [];
  for (const floorData of floorsData) {
    const floor = await prisma.floor.create({
      data: {
        name: floorData.name,
        sequence: floorData.sequence,
      },
    });
    
    for (const tableData of floorData.tables) {
      const table = await prisma.table.create({
        data: {
          number: tableData.number,
          seats: tableData.seats,
          floorId: floor.id,
        },
      });
      tables.push(table);
    }
    console.log(`   Created ${floorData.name} with ${floorData.tables.length} tables`);
  }
  
  return tables;
}

async function seedInventoryStock(ingredients) {
  console.log('📦 Seeding inventory stock...');
  
  for (const [name, ingredient] of Object.entries(ingredients)) {
    // Set initial stock to 3-5x the minimum stock
    const multiplier = 3 + Math.random() * 2;
    const initialQty = ingredient.minStock * multiplier;
    
    await prisma.inventoryStock.create({
      data: {
        ingredientId: ingredient.id,
        quantity: parseFloat(initialQty.toFixed(2)),
      },
    });
  }
  console.log(`   ✅ Created stock for ${Object.keys(ingredients).length} ingredients`);
}

async function seedPosConfig() {
  console.log('⚙️  Seeding POS config...');
  
  await prisma.posConfig.create({
    data: {
      posName: 'Restaurant POS',
      defaultTax: 5.0,
      enableKitchenDisplay: true,
      enableCash: true,
      enableDigital: true,
      enableUpi: true,
      upiId: 'restaurant@upi',
    },
  });
  
  await prisma.receiptSettings.create({
    data: {
      restaurantName: 'Sample Restaurant',
      address: '123 Main Street, Mumbai',
      phone: '+91 9876543210',
      gstNumber: '27AABCU9603R1ZM',
      showOrderNumber: true,
      showCashier: true,
      showPaymentMethod: true,
      showItemTax: true,
      showTotalTax: true,
      footerText: 'Thank you for dining with us!',
    },
  });
  
  console.log('   ✅ POS config created');
}

async function seedSampleOrders(users, tables, products) {
  console.log('📝 Seeding sample orders...');
  
  const cashier = users.find(u => u.role === 'cashier');
  
  // Create a POS session
  const session = await prisma.pOS_Session.create({
    data: {
      openedBy: cashier.id,
      status: 'open',
    },
  });
  
  // Sample orders with different statuses
  const orderTemplates = [
    {
      items: [
        { product: 'Butter Chicken', qty: 2 },
        { product: 'Garlic Naan', qty: 4 },
        { product: 'Mango Lassi', qty: 2 },
      ],
      status: 'paid',
      tableIndex: 0,
    },
    {
      items: [
        { product: 'Paneer Tikka', qty: 1 },
        { product: 'Veg Biryani', qty: 2 },
        { product: 'Sweet Lassi', qty: 2 },
      ],
      status: 'paid',
      tableIndex: 1,
    },
    {
      items: [
        { product: 'Chicken Biryani', qty: 3 },
        { product: 'Chicken 65', qty: 2 },
        { product: 'Coca Cola', qty: 3 },
      ],
      status: 'completed',
      tableIndex: 2,
    },
    {
      items: [
        { product: 'Fish Curry', qty: 1 },
        { product: 'Naan Bread', qty: 3 },
        { product: 'Masala Chai', qty: 2 },
      ],
      status: 'sent_to_kitchen',
      tableIndex: 3,
    },
  ];
  
  for (const template of orderTemplates) {
    const table = tables[template.tableIndex];
    
    // Calculate total
    let total = 0;
    const orderLines = [];
    
    for (const item of template.items) {
      const product = products[item.product];
      if (!product) {
        console.log(`   ⚠️  Product not found: ${item.product}`);
        continue;
      }
      
      const lineTotal = product.price * item.qty;
      total += lineTotal;
      
      orderLines.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: item.qty,
        kitchenStation: product.kitchenStation,
        sentToKitchen: template.status !== 'draft',
        kitchenStatus: template.status === 'sent_to_kitchen' ? 'PENDING' : 'READY',
        sentToKitchenAt: new Date(),
      });
    }
    
    const order = await prisma.order.create({
      data: {
        sessionId: session.id,
        userId: cashier.id,
        tableId: table.id,
        status: template.status,
        total: total,
        orderLines: {
          create: orderLines,
        },
      },
    });
    
    // Create payment for paid orders
    if (template.status === 'paid') {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          method: Math.random() > 0.5 ? 'cash' : 'digital',
        },
      });
    }
    
    // Create kitchen ticket for non-draft orders
    if (template.status !== 'draft') {
      await prisma.kitchenTicket.create({
        data: {
          orderId: order.id,
          status: template.status === 'paid' ? 'complete' : 'to_cook',
        },
      });
    }
    
    console.log(`   Created order at Table ${table.number} - Status: ${template.status}`);
  }
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('🌱 Starting database seed...\n');
  
  try {
    await clearDatabase();
    
    const users = await seedUsers();
    const categories = await seedCategories();
    const ingredients = await seedIngredients();
    const products = await seedProducts(categories, ingredients);
    const tables = await seedFloorsAndTables();
    
    await seedInventoryStock(ingredients);
    await seedPosConfig();
    await seedSampleOrders(users, tables, products);
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   admin@restaurant.com / password123');
    console.log('   cashier@restaurant.com / password123');
    console.log('   kitchen@restaurant.com / password123');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
