import { kitchenService } from '../services/kitchen.service.js';
import { getIO, emitItemStatusUpdate, emitOrderReadyUpdate } from '../socket/kitchen.socket.js';

export const kitchenController = {
  /**
   * Get all kitchen orders (item-level tracking)
   */
  async getKitchenOrders(req, res, next) {
    try {
      const { station } = req.query;
      const orders = await kitchenService.getKitchenOrders(station);

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update kitchen item status
   */
  async updateItemStatus(req, res, next) {
    try {
      const { itemId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required (PENDING, PREPARING, or READY)',
        });
      }

      const item = await kitchenService.updateItemStatus(
        parseInt(itemId),
        status
      );

      // Emit granular item status update
      emitItemStatusUpdate(item);

      // Check if order is now ready and emit order update
      const orders = await kitchenService.getKitchenOrders();
      const affectedOrder = orders.find(o => 
        o.items.some(i => i.id === parseInt(itemId))
      );
      
      if (affectedOrder && affectedOrder.isReadyToServe) {
        emitOrderReadyUpdate(affectedOrder);
      }

      res.status(200).json({
        success: true,
        message: `Item status updated to "${status}"`,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  },

  // Legacy ticket-based endpoints (kept for backward compatibility)
  async getActiveTickets(req, res, next) {
    try {
      const tickets = await kitchenService.getActiveTickets();

      res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  },

  async getTicket(req, res, next) {
    try {
      const { id } = req.params;

      const ticket = await kitchenService.getTicketById(id);

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  },

  async moveToNextStatus(req, res, next) {
    try {
      const { id } = req.params;

      const ticket = await kitchenService.moveToNextStatus(id);

      // Emit socket event for real-time update
      const io = getIO();
      if (io) {
        io.to('kitchen').emit('kitchen:update', {
          type: 'status_change',
          ticket,
        });
      }

      res.status(200).json({
        success: true,
        message: `Ticket moved to "${ticket.status}"`,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  },

  async getCompletedTickets(req, res, next) {
    try {
      const tickets = await kitchenService.getCompletedTickets();

      res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  },

  // ─── STOCK MANAGEMENT ────────────────────────────────────────────────

  /**
   * Get all ingredient stock levels
   */
  async getStock(req, res, next) {
    try {
      const stock = await kitchenService.getIngredientStock();

      res.status(200).json({
        success: true,
        data: stock,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(req, res, next) {
    try {
      const alerts = await kitchenService.getLowStockAlerts();

      res.status(200).json({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update ingredient stock (set to specific value)
   */
  async updateStock(req, res, next) {
    try {
      const { ingredientId } = req.params;
      const { quantity, notes } = req.body;

      if (quantity === undefined || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity is required and must be non-negative',
        });
      }

      const result = await kitchenService.updateIngredientStock({
        ingredientId,
        quantity: parseFloat(quantity),
        notes,
        userId: req.user?.userId,
      });

      res.status(200).json({
        success: true,
        message: `Stock updated: ${result.previousStock} → ${result.newStock} ${result.name}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add stock to an ingredient
   */
  async addStock(req, res, next) {
    try {
      const { ingredientId } = req.params;
      const { quantity, notes } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a positive number',
        });
      }

      const result = await kitchenService.addStock({
        ingredientId,
        quantityToAdd: parseFloat(quantity),
        notes,
        userId: req.user?.userId,
      });

      res.status(200).json({
        success: true,
        message: `Added ${quantity} to ${result.name}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get stock history for an ingredient
   */
  async getStockHistory(req, res, next) {
    try {
      const { ingredientId } = req.params;
      const { limit } = req.query;

      const history = await kitchenService.getStockHistory(
        ingredientId,
        limit ? parseInt(limit) : 20
      );

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  },
};