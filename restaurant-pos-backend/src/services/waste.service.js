/**
 * Waste Tracking Service
 * Handles food waste recording with inventory deduction.
 * 
 * Design: Each waste event creates:
 * 1. WasteEvent record for tracking/analytics
 * 2. InventoryLedger entry (negative) for audit trail
 * 3. InventoryStock update for current levels
 */

import prisma from '../prisma/client.js';

// Valid waste reasons
export const WASTE_REASONS = ['SPOILAGE', 'OVERCOOKED', 'RETURNED', 'PREP_LOSS'];

// Valid kitchen stations
export const KITCHEN_STATIONS = ['GRILL', 'FRYER', 'DRINKS', 'DESSERT', 'GENERAL'];

export const wasteService = {
  /**
   * Record a waste event with inventory deduction.
   * Uses a transaction to ensure data consistency.
   * 
   * @param {Object} data - Waste event data
   * @param {string} data.ingredientId - Ingredient being wasted
   * @param {number} data.quantity - Amount wasted (positive number)
   * @param {string} data.reason - SPOILAGE | OVERCOOKED | RETURNED | PREP_LOSS
   * @param {string} data.station - Kitchen station
   * @param {string} [data.notes] - Optional notes
   * @param {string} userId - User recording the waste
   * @returns {Promise<Object>} Created waste event with related data
   */
  async recordWaste(data, userId) {
    const { ingredientId, quantity, reason, station, notes } = data;

    // Validate required fields
    if (!ingredientId) {
      throw new Error('Ingredient ID is required');
    }
    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }
    if (!reason || !WASTE_REASONS.includes(reason)) {
      throw new Error(`Invalid reason. Must be one of: ${WASTE_REASONS.join(', ')}`);
    }
    if (station && !KITCHEN_STATIONS.includes(station)) {
      throw new Error(`Invalid station. Must be one of: ${KITCHEN_STATIONS.join(', ')}`);
    }

    // Verify ingredient exists
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: { stock: true }
    });

    if (!ingredient) {
      throw new Error('Ingredient not found');
    }

    // Find active session for the user (optional link)
    const activeSession = await prisma.pOS_Session.findFirst({
      where: {
        openedBy: userId,
        status: 'open'
      }
    });

    // Calculate new balance
    const currentQty = ingredient.stock?.quantity || 0;
    const newBalance = currentQty - quantity;

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create waste event
      const wasteEvent = await tx.wasteEvent.create({
        data: {
          ingredientId,
          quantity,
          reason,
          station: station || 'GENERAL',
          sessionId: activeSession?.id || null,
          notes: notes || null,
          createdBy: userId
        },
        include: {
          ingredient: {
            select: { name: true, unit: true }
          },
          user: {
            select: { email: true }
          }
        }
      });

      // 2. Create inventory ledger entry (negative quantity for waste)
      await tx.inventoryLedger.create({
        data: {
          ingredientId,
          changeQty: -quantity,
          balanceAfter: newBalance,
          source: 'WASTE',
          referenceId: wasteEvent.id,
          notes: `Waste: ${reason}${notes ? ' - ' + notes : ''}`,
          createdBy: userId
        }
      });

      // 3. Update or create inventory stock
      if (ingredient.stock) {
        await tx.inventoryStock.update({
          where: { ingredientId },
          data: {
            quantity: newBalance,
            lastUpdated: new Date()
          }
        });
      } else {
        await tx.inventoryStock.create({
          data: {
            ingredientId,
            quantity: newBalance
          }
        });
      }

      return wasteEvent;
    });

    return result;
  },

  /**
   * Get waste events with optional filters.
   * 
   * @param {Object} options - Query options
   * @param {Date} [options.from] - Start date
   * @param {Date} [options.to] - End date
   * @param {string} [options.reason] - Filter by reason
   * @param {string} [options.station] - Filter by station
   * @param {string} [options.ingredientId] - Filter by ingredient
   * @param {number} [options.limit] - Max results (default 100)
   * @returns {Promise<Array>} Waste events
   */
  async getWasteEvents(options = {}) {
    const { from, to, reason, station, ingredientId, limit = 100 } = options;

    const where = {};

    if (from) {
      where.createdAt = { ...where.createdAt, gte: new Date(from) };
    }
    if (to) {
      where.createdAt = { ...where.createdAt, lte: new Date(to) };
    }
    if (reason) {
      where.reason = reason;
    }
    if (station) {
      where.station = station;
    }
    if (ingredientId) {
      where.ingredientId = ingredientId;
    }

    const wasteEvents = await prisma.wasteEvent.findMany({
      where,
      include: {
        ingredient: {
          select: { id: true, name: true, unit: true, costPerUnit: true }
        },
        user: {
          select: { id: true, email: true }
        },
        session: {
          select: { id: true, openedAt: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Calculate cost for each event
    return wasteEvents.map(event => ({
      ...event,
      estimatedCost: event.quantity * (event.ingredient.costPerUnit || 0)
    }));
  },

  /**
   * Get waste summary statistics.
   * 
   * @param {Object} options - Query options
   * @param {Date} [options.from] - Start date
   * @param {Date} [options.to] - End date
   * @returns {Promise<Object>} Summary statistics
   */
  async getWasteSummary(options = {}) {
    const { from, to } = options;

    const where = {};
    if (from) {
      where.createdAt = { ...where.createdAt, gte: new Date(from) };
    }
    if (to) {
      where.createdAt = { ...where.createdAt, lte: new Date(to) };
    }

    // Get waste events with ingredient cost
    const events = await prisma.wasteEvent.findMany({
      where,
      include: {
        ingredient: {
          select: { costPerUnit: true }
        }
      }
    });

    // Calculate totals
    const totalEvents = events.length;
    const totalCost = events.reduce(
      (sum, e) => sum + (e.quantity * (e.ingredient.costPerUnit || 0)),
      0
    );

    // Group by reason
    const byReason = {};
    for (const reason of WASTE_REASONS) {
      const reasonEvents = events.filter(e => e.reason === reason);
      byReason[reason] = {
        count: reasonEvents.length,
        cost: reasonEvents.reduce(
          (sum, e) => sum + (e.quantity * (e.ingredient.costPerUnit || 0)),
          0
        )
      };
    }

    // Group by station
    const byStation = {};
    for (const station of KITCHEN_STATIONS) {
      const stationEvents = events.filter(e => e.station === station);
      byStation[station] = {
        count: stationEvents.length,
        cost: stationEvents.reduce(
          (sum, e) => sum + (e.quantity * (e.ingredient.costPerUnit || 0)),
          0
        )
      };
    }

    return {
      totalEvents,
      totalCost: Math.round(totalCost * 100) / 100,
      byReason,
      byStation
    };
  }
};
