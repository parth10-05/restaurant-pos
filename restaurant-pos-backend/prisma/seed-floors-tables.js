import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed realistic restaurant floor and table layout
 * 
 * LAYOUT DESIGN:
 * - Ground Floor: Main dining area (Tables 1-15)
 * - First Floor: Family section (Tables 16-25)
 * - Rooftop: Premium dining (Tables 26-30)
 * - Garden Area: Outdoor seating (Tables 31-38)
 */

const floorsData = [
  {
    name: 'Ground Floor',
    sequence: 1,
    active: true,
    tables: [
      { number: 1, seats: 2 },
      { number: 2, seats: 2 },
      { number: 3, seats: 4 },
      { number: 4, seats: 4 },
      { number: 5, seats: 4 },
      { number: 6, seats: 4 },
      { number: 7, seats: 6 },
      { number: 8, seats: 6 },
      { number: 9, seats: 2 },
      { number: 10, seats: 2 },
      { number: 11, seats: 4 },
      { number: 12, seats: 4 },
      { number: 13, seats: 8 },
      { number: 14, seats: 4 },
      { number: 15, seats: 4 },
    ],
  },
  {
    name: 'First Floor',
    sequence: 2,
    active: true,
    tables: [
      { number: 16, seats: 6 },
      { number: 17, seats: 6 },
      { number: 18, seats: 8 },
      { number: 19, seats: 4 },
      { number: 20, seats: 4 },
      { number: 21, seats: 4 },
      { number: 22, seats: 6 },
      { number: 23, seats: 2 },
      { number: 24, seats: 2 },
      { number: 25, seats: 10 },
    ],
  },
  {
    name: 'Rooftop',
    sequence: 3,
    active: true,
    tables: [
      { number: 26, seats: 4 },
      { number: 27, seats: 4 },
      { number: 28, seats: 6 },
      { number: 29, seats: 8 },
      { number: 30, seats: 2 },
    ],
  },
  {
    name: 'Garden Area',
    sequence: 4,
    active: true,
    tables: [
      { number: 31, seats: 4 },
      { number: 32, seats: 4 },
      { number: 33, seats: 6 },
      { number: 34, seats: 6 },
      { number: 35, seats: 2 },
      { number: 36, seats: 2 },
      { number: 37, seats: 8 },
      { number: 38, seats: 4 },
    ],
  },
];

async function seedFloorsAndTables() {
  console.log('🏢 Starting floor and table seed...\n');

  try {
    let totalFloorsCreated = 0;
    let totalFloorsSkipped = 0;
    let totalTablesCreated = 0;
    let totalTablesSkipped = 0;

    for (const floorData of floorsData) {
      console.log(`📂 Processing: ${floorData.name}`);

      // Check if floor exists
      let floor = await prisma.floor.findFirst({
        where: { name: floorData.name },
      });

      if (floor) {
        console.log(`   - Floor exists: ${floorData.name}`);
        totalFloorsSkipped++;
      } else {
        // Create floor
        floor = await prisma.floor.create({
          data: {
            name: floorData.name,
            sequence: floorData.sequence,
            active: floorData.active,
          },
        });
        console.log(`   ✓ Created floor: ${floorData.name}`);
        totalFloorsCreated++;
      }

      // Seed tables for this floor
      let floorTableCount = 0;
      for (const tableData of floorData.tables) {
        const existing = await prisma.table.findUnique({
          where: {
            floorId_number: {
              floorId: floor.id,
              number: tableData.number,
            },
          },
        });

        if (existing) {
          totalTablesSkipped++;
        } else {
          await prisma.table.create({
            data: {
              number: tableData.number,
              seats: tableData.seats,
              floorId: floor.id,
              active: true,
            },
          });
          floorTableCount++;
          totalTablesCreated++;
        }
      }

      if (floorTableCount > 0) {
        console.log(`   ✓ Added ${floorTableCount} tables`);
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Floor & Table seeding completed!');
    console.log(`   Floors created: ${totalFloorsCreated}`);
    console.log(`   Floors skipped: ${totalFloorsSkipped}`);
    console.log(`   Tables created: ${totalTablesCreated}`);
    console.log(`   Tables skipped: ${totalTablesSkipped}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Display summary
    console.log('📊 Restaurant Layout Summary:\n');
    const floors = await prisma.floor.findMany({
      include: {
        _count: {
          select: { tables: true },
        },
      },
      orderBy: { sequence: 'asc' },
    });

    let totalSeats = 0;
    for (const floor of floors) {
      const tables = await prisma.table.findMany({
        where: { floorId: floor.id },
      });
      const floorSeats = tables.reduce((sum, t) => sum + t.seats, 0);
      totalSeats += floorSeats;

      console.log(`   ${floor.name}:`);
      console.log(`      Tables: ${floor._count.tables}`);
      console.log(`      Total Seats: ${floorSeats}`);
      console.log('');
    }

    console.log(`   🪑 Total Restaurant Capacity: ${totalSeats} seats`);
    console.log(`   🏢 Total Floors: ${floors.length}`);
    console.log(`   📋 Total Tables: ${totalTablesCreated + totalTablesSkipped}`);

  } catch (error) {
    console.error('❌ Error seeding floors and tables:', error);
    throw error;
  }
}

seedFloorsAndTables()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });