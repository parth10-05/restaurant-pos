import { Router } from 'express';
import { kitchenController } from '../controllers/kitchen.controller.js';
import { wasteController } from '../controllers/waste.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// All kitchen routes require authentication
router.use(authMiddleware);

// Only kitchen staff and admin can access
router.use(requireRole('kitchen', 'admin'));

// ─── WASTE TRACKING ──────────────────────────────────────────────────
// Record waste event
router.post('/waste', wasteController.recordWaste);

// Get valid waste reasons (for dropdown)
router.get('/waste/reasons', wasteController.getWasteReasons);

// Get valid kitchen stations (for dropdown)
router.get('/waste/stations', wasteController.getKitchenStations);

// ─── KITCHEN DISPLAY ─────────────────────────────────────────────────
// NEW: Item-level kitchen display system
// Get all kitchen orders with item-level tracking
router.get('/orders', kitchenController.getKitchenOrders);

// Update kitchen item status
router.put('/items/:itemId/status', kitchenController.updateItemStatus);

// LEGACY: Ticket-based endpoints (kept for backward compatibility)
// Get all active tickets (to_cook, preparing)
router.get('/tickets', kitchenController.getActiveTickets);

// Get completed tickets (history)
router.get('/tickets/completed', kitchenController.getCompletedTickets);

// Get specific ticket
router.get('/tickets/:id', kitchenController.getTicket);

// Move ticket to next status
router.patch('/tickets/:id/next', kitchenController.moveToNextStatus);

// ─── STOCK MANAGEMENT ────────────────────────────────────────────────
// Get all ingredient stock levels
router.get('/stock', kitchenController.getStock);

// Get low stock alerts
router.get('/stock/alerts', kitchenController.getLowStockAlerts);

// Get stock history for an ingredient
router.get('/stock/:ingredientId/history', kitchenController.getStockHistory);

// Update ingredient stock (set to specific value)
router.put('/stock/:ingredientId', kitchenController.updateStock);

// Add stock to an ingredient
router.post('/stock/:ingredientId/add', kitchenController.addStock);

export default router;