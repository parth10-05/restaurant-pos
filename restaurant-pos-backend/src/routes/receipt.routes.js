import express from 'express';
import * as receiptController from '../controllers/receipt.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Require authentication
router.use(authMiddleware);

// GET /orders/:orderId/receipt
router.get('/:orderId/receipt', receiptController.downloadReceipt);

export default router;
