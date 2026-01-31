import prisma from '../prisma/client.js';

/**
 * Floor Service
 * 
 * OPERATIONAL RULES:
 * - Floors organize tables for POS floor view
 * - Sequence controls display order in POS
 * - Only active floors appear in POS
 * - Floors cannot be deleted if they have tables
 * - Soft delete (active=false) is preferred
 */

export const floorService = {
  /**
   * Get all floors with table counts
   */
  async getAllFloors(includeInactive = false) {
    const where = includeInactive ? {} : { active: true };

    const floors = await prisma.floor.findMany({
      where,
      include: {
        _count: {
          select: { tables: true },
        },
      },
      orderBy: { sequence: 'asc' },
    });

    return floors;
  },

  /**
   * Get single floor by ID
   */
  async getFloorById(id) {
    const floor = await prisma.floor.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tables: true },
        },
      },
    });

    if (!floor) {
      const error = new Error('Floor not found');
      error.statusCode = 404;
      throw error;
    }

    return floor;
  },

  /**
   * Create new floor
   */
  async createFloor(data) {
    // Validate
    if (!data.name || data.name.trim().length === 0) {
      const error = new Error('Floor name is required');
      error.statusCode = 400;
      throw error;
    }

    // Auto-sequence: get max sequence + 1
    const maxSequence = await prisma.floor.aggregate({
      _max: { sequence: true },
    });

    const sequence = data.sequence || (maxSequence._max.sequence || 0) + 1;

    const floor = await prisma.floor.create({
      data: {
        name: data.name,
        sequence,
        active: data.active !== undefined ? data.active : true,
      },
    });

    return floor;
  },

  /**
   * Update floor
   */
  async updateFloor(id, data) {
    await this.getFloorById(id);

    const updated = await prisma.floor.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.sequence !== undefined && { sequence: data.sequence }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });

    return updated;
  },

  /**
   * Delete floor (soft delete)
   */
  async deleteFloor(id) {
    const floor = await this.getFloorById(id);

    // Check if floor has tables
    const tableCount = await prisma.table.count({
      where: { floorId: id },
    });

    if (tableCount > 0) {
      const error = new Error(
        `Cannot delete floor with ${tableCount} table(s). Please move or delete tables first.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Soft delete
    const deleted = await prisma.floor.update({
      where: { id },
      data: { active: false },
    });

    return deleted;
  },
};