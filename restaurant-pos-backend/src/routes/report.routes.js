import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

/**
 * Report Routes
 * 
 * All endpoints support query params:
 * - from: Start date (YYYY-MM-DD)
 * - to: End date (YYYY-MM-DD)
 * 
 * If not provided, defaults to all-time data
 */

router.get('/reports/summary', reportController.getSummary);
router.get('/reports/payments', reportController.getPaymentReport);
router.get('/reports/sessions', reportController.getSessionReport);
router.get('/reports/products', reportController.getProductReport);
router.get('/reports/categories', reportController.getCategoryReport);

export default router;