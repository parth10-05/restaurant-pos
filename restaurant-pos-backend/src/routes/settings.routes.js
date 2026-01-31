import express from 'express';
import * as receiptSettingsController from '../controllers/receiptSettings.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

// GET /admin/settings/receipt
router.get('/receipt', receiptSettingsController.getReceiptSettings);

// PUT /admin/settings/receipt
router.put('/receipt', receiptSettingsController.updateReceiptSettings);

export default router;
