import { Router } from 'express';
import { posConfigController } from '../controllers/posConfig.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// All admin routes require authentication
router.use(authMiddleware);

// Only admin can access
router.use(requireRole('admin'));

// POS Configuration
router.get('/pos-config', posConfigController.getConfig);
router.put('/pos-config', posConfigController.updateConfig);

// Helper endpoint for payment methods
router.get('/payment-methods', posConfigController.getAvailablePaymentMethods);

export default router;