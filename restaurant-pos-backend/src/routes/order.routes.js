import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireOpenSession } from '../middlewares/session.middleware.js';

const router = Router();

// All order routes require authentication and open session
router.use(authMiddleware);
router.use(requireOpenSession);

// Create new order
router.post('/', orderController.createOrder);

// Get all orders in current session
router.get('/', orderController.getSessionOrders);

// Get specific order
router.get('/:id', orderController.getOrder);

// Add line item to order
router.post('/:id/lines', orderController.addOrderLine);

// Send order to kitchen
router.patch('/:id/send', orderController.sendToKitchen);

// Complete order (ready for payment)
router.patch('/:id/complete', orderController.completeOrder);

// Pay for order
router.post('/:id/pay', orderController.payOrder);

export default router;