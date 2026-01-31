import { sessionService } from '../services/session.service.js';

export const requireOpenSession = async (req, res, next) => {
  try {
    const session = await sessionService.requireOpenSession();
    
    // Attach session to request for use in controllers
    req.session = session;
    
    next();
  } catch (error) {
    return res.status(error.statusCode || 403).json({
      success: false,
      message: error.message || 'No open POS session. Open a session before proceeding.',
    });
  }
};