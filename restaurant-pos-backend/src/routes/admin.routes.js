import { Router } from 'express';
import { posConfigController } from '../controllers/posConfig.controller.js';
import { wasteController } from '../controllers/waste.controller.js';
import * as analyticsController from '../controllers/analytics.controller.js';
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

// ─── WASTE TRACKING (Admin) ──────────────────────────────────────────
// Get waste events with filters
router.get('/waste', wasteController.getWasteEvents);

// Get waste summary statistics
router.get('/waste/summary', wasteController.getWasteSummary);

// ─── ANALYTICS FOR AI/ML (Read-only) ─────────────────────────────────
// Query params: startDate, endDate (YYYY-MM-DD), defaults to last 30 days

// Daily ingredient consumption from orders
router.get('/analytics/consumption', analyticsController.getConsumption);

// Daily waste per ingredient (add ?summary=true for aggregated totals)
router.get('/analytics/waste', analyticsController.getWaste);

// Hourly sales volume per product (add ?pattern=true for avg hourly pattern)
router.get('/analytics/sales-timeseries', analyticsController.getSalesTimeseries);

// Prep time per kitchen station (groupBy: station|product|timeseries)
router.get('/analytics/prep-time', analyticsController.getPrepTime);

// Daily sales summary
router.get('/analytics/daily-summary', analyticsController.getDailySummary);

// Full analytics export for ML training
router.get('/analytics/export', analyticsController.getFullExport);

export default router;