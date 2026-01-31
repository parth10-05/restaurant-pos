import { kitchenService } from '../services/kitchen.service.js';
import { getIO } from '../socket/kitchen.socket.js';

export const kitchenController = {
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