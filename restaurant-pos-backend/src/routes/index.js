import { Router } from 'express';
import authRoutes from './auth.routes.js';
import sessionRoutes from './session.routes.js';
import orderRoutes from './order.routes.js';
import kitchenRoutes from './kitchen.routes.js';
import adminRoutes from './admin.routes.js';
import productRoutes from './product.routes.js';
import floorRoutes from './floor.routes.js';
import reportRoutes from './report.routes.js';
import settingsRoutes from './settings.routes.js';
import receiptRoutes from './receipt.routes.js';
import cashierRoutes from './cashier.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Auth routes
router.use('/auth', authRoutes);

// Session routes
router.use('/sessions', sessionRoutes);

// Order routes
router.use('/orders', orderRoutes);

// Kitchen routes
router.use('/kitchen', kitchenRoutes);

// Cashier routes (read-only access to floors, tables, products, categories)
router.use('/cashier', cashierRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Product routes (admin only)
router.use('/admin', productRoutes);

// Floor routes (admin only)
router.use('/admin', floorRoutes);

// Report routes (admin only)
router.use('/admin', reportRoutes);

// Settings routes (admin only)
router.use('/admin/settings', settingsRoutes);

// Receipt routes (authenticated users)
router.use('/orders', receiptRoutes);

export default router;