import { authService } from '../services/auth.service.js';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is required',
      });
    }

    const decoded = authService.verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Unauthorized',
    });
  }
};
