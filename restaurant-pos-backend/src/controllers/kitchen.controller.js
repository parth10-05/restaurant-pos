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
};