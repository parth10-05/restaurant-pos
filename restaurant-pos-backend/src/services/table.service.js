import prisma from '../prisma/client.js';

/**
 * Table Service
 * 
 * OPERATIONAL RULES:
 * - Tables drive POS floor view and order assignment
 * - Table number must be unique per floor
 * - Only active tables appear in POS
 * - Orders reference tableId
 * - Table status managed during order lifecycle (not here)
 */

export const tableService = {
  /**
   * Get all tables for a floor
   */
  async getTablesByFloor(floorId, includeInactive = false) {
    const where = {
      floorId,
      ...(includeInactive ? {} : { active: true }),
    };

    const tables = await prisma.table.findMany({
      where,
      include: {
        floor: true,
      },
      orderBy: { number: 'asc' },
    });

    return tables;
  },

  /**
   * Get single table
   */
  async getTableById(id) {
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        floor: true,
      },
    });

    if (!table) {
      const error = new Error('Table not found');
      error.statusCode = 404;
      throw error;
    }

    return table;
  },

  /**
   * Create new table
   */
  async createTable(floorId, data) {
    // Validate
    if (!data.number || data.number <= 0) {
      const error = new Error('Valid table number is required');
      error.statusCode = 400;
      throw error;
    }

    if (!data.seats || data.seats <= 0) {
      const error = new Error('Number of seats must be greater than 0');
      error.statusCode = 400;
      throw error;
    }

    // Check floor exists
    const floor = await prisma.floor.findUnique({
      where: { id: floorId },
    });

    if (!floor) {
      const error = new Error('Floor not found');
      error.statusCode = 404;
      throw error;
    }

    // Check table number uniqueness per floor
    const existing = await prisma.table.findUnique({
      where: {
        floorId_number: {
          floorId,
          number: data.number,
        },
      },
    });

    if (existing) {
      const error = new Error('Table number already exists on this floor');
      error.statusCode = 400;
      throw error;
    }

    const table = await prisma.table.create({
      data: {
        number: data.number,
        seats: data.seats,
        floorId,
        active: data.active !== undefined ? data.active : true,
      },
      include: {
        floor: true,
      },
    });

    return table;
  },

  /**
   * Update table
   */
  async updateTable(id, data) {
    const table = await this.getTableById(id);

    // Validate if provided
    if (data.number !== undefined && data.number <= 0) {
      const error = new Error('Table number must be greater than 0');
      error.statusCode = 400;
      throw error;
    }

    if (data.seats !== undefined && data.seats <= 0) {
      const error = new Error('Number of seats must be greater than 0');
      error.statusCode = 400;
      throw error;
    }

    // Check table number uniqueness if changing
    if (data.number && data.number !== table.number) {
      const existing = await prisma.table.findUnique({
        where: {
          floorId_number: {
            floorId: table.floorId,
            number: data.number,
          },
        },
      });

      if (existing) {
        const error = new Error('Table number already exists on this floor');
        error.statusCode = 400;
        throw error;
      }
    }

    const updated = await prisma.table.update({
      where: { id },
      data: {
        ...(data.number !== undefined && { number: data.number }),
        ...(data.seats !== undefined && { seats: data.seats }),
        ...(data.active !== undefined && { active: data.active }),
      },
      include: {
        floor: true,
      },
    });

    return updated;
  },

  /**
   * Delete table (soft delete)
   */
  async deleteTable(id) {
    await this.getTableById(id);

    // Soft delete
    const deleted = await prisma.table.update({
      where: { id },
      data: { active: false },
    });

    return deleted;
  },
};