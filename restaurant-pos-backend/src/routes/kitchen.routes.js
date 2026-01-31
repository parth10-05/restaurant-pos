import { Router } from 'express';
import { kitchenController } from '../controllers/kitchen.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// All kitchen routes require authentication
router.use(authMiddleware);

// Only kitchen staff and admin can access
router.use(requireRole('kitchen', 'admin'));

// Get all active tickets (to_cook, preparing)
router.get('/tickets', kitchenController.getActiveTickets);

// Get completed tickets (history)
router.get('/tickets/completed', kitchenController.getCompletedTickets);

// Get specific ticket
router.get('/tickets/:id', kitchenController.getTicket);

// Move ticket to next status
router.patch('/tickets/:id/next', kitchenController.moveToNextStatus);

export default router;