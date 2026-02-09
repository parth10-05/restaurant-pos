import prisma from './src/prisma/client.js';

async function check() {
  console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
  
  const ingredients = await prisma.ingredient.count();
  console.log('Ingredients:', ingredients);
  
  try {
    const ledger = await prisma.inventoryLedger.count();
    console.log('InventoryLedger:', ledger);
  } catch (e) {
    console.log('InventoryLedger error:', e.message);
  }
  
  try {
    const waste = await prisma.wasteEvent.count();
    console.log('WasteEvent:', waste);
  } catch (e) {
    console.log('WasteEvent error:', e.message);
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
