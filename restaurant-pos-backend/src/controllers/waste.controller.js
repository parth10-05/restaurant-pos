/**
 * Waste Controller
 * HTTP handlers for waste tracking endpoints.
 */

import { wasteService, WASTE_REASONS, KITCHEN_STATIONS } from '../services/waste.service.js';

export const wasteController = {
  /**
   * POST /api/kitchen/waste
   * Record a waste event (kitchen/admin only)
   */
  async recordWaste(req, res) {
    try {
      const userId = req.user.userId;
      const { ingredientId, quantity, reason, station, notes } = req.body;

      // Basic validation
      if (!ingredientId) {
        return res.status(400).json({
          success: false,
          message: 'ingredientId is required'
        });
      }

      if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'quantity must be a positive number'
        });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: `reason is required. Valid values: ${WASTE_REASONS.join(', ')}`
        });
      }

      const wasteEvent = await wasteService.recordWaste(
        { ingredientId, quantity, reason, station, notes },
        userId
      );

      res.status(201).json({
        success: true,
        data: wasteEvent
      });
    } catch (error) {
      console.error('[WasteController] recordWaste error:', error);
      
      // Handle known validation errors
      if (error.message.includes('Invalid') || 
          error.message.includes('required') ||
          error.message.includes('not found')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to record waste event'
      });
    }
  },

  /**
   * GET /api/admin/waste
   * Get waste events with optional filters (admin only)
   * Query params: from, to, reason, station, ingredientId, limit
   */
  async getWasteEvents(req, res) {
    try {
      const { from, to, reason, station, ingredientId, limit } = req.query;

      // Validate reason if provided
      if (reason && !WASTE_REASONS.includes(reason)) {
        return res.status(400).json({
          success: false,
          message: `Invalid reason. Valid values: ${WASTE_REASONS.join(', ')}`
        });
      }

      // Validate station if provided
      if (station && !KITCHEN_STATIONS.includes(station)) {
        return res.status(400).json({
          success: false,
          message: `Invalid station. Valid values: ${KITCHEN_STATIONS.join(', ')}`
        });
      }

      const wasteEvents = await wasteService.getWasteEvents({
        from,
        to,
        reason,
        station,
        ingredientId,
        limit: limit ? parseInt(limit) : undefined
      });

      res.json({
        success: true,
        data: wasteEvents,
        meta: {
          count: wasteEvents.length,
          filters: { from, to, reason, station, ingredientId }
        }
      });
    } catch (error) {
      console.error('[WasteController] getWasteEvents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch waste events'
      });
    }
  },

  /**
   * GET /api/admin/waste/summary
   * Get waste summary statistics (admin only)
   * Query params: from, to
   */
  async getWasteSummary(req, res) {
    try {
      const { from, to } = req.query;

      const summary = await wasteService.getWasteSummary({ from, to });

      res.json({
        success: true,
        data: summary,
        meta: {
          filters: { from, to }
        }
      });
    } catch (error) {
      console.error('[WasteController] getWasteSummary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch waste summary'
      });
    }
  },

  /**
   * GET /api/kitchen/waste/reasons
   * Get valid waste reasons (for frontend dropdowns)
   */
  async getWasteReasons(req, res) {
    res.json({
      success: true,
      data: WASTE_REASONS
    });
  },

  /**
   * GET /api/kitchen/waste/stations
   * Get valid kitchen stations (for frontend dropdowns)
   */
  async getKitchenStations(req, res) {
    res.json({
      success: true,
      data: KITCHEN_STATIONS
    });
  }
};
