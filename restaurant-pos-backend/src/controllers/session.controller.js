import { sessionService } from '../services/session.service.js';

export const sessionController = {
  async openSession(req, res, next) {
    try {
      const userId = req.user.userId;

      const session = await sessionService.openSession(userId);

      res.status(201).json({
        success: true,
        message: 'Session opened successfully',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  },

  async closeSession(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await sessionService.closeSession(userId);

      res.status(200).json({
        success: true,
        message: 'Session closed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getCurrentSession(req, res, next) {
    try {
      const session = await sessionService.getCurrentSession();

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  },
};