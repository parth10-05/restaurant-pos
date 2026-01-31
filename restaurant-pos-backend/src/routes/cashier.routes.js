import { Router } from 'express';
import { floorController } from '../controllers/floor.controller.js';
import { tableController } from '../controllers/table.controller.js';
import { categoryController } from '../controllers/category.controller.js';
import { productController } from '../controllers/product.controller.js';
import { posConfigController } from '../controllers/posConfig.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication (any authenticated user can read)
router.use(authMiddleware);

// Floor routes (read-only for cashiers)
router.get('/floors', floorController.getAll);
router.get('/floors/:floorId/tables', tableController.getByFloor);

// Get active order for a table
router.get('/tables/:id/active-order', tableController.getActiveOrder);

// Category routes (read-only for cashiers)
router.get('/categories', categoryController.getAll);

// Product routes (read-only for cashiers)
router.get('/products', productController.getAll);

// POS Config (read-only for cashiers - needed for payment methods)
router.get('/pos-config', posConfigController.getConfig);

export default router;
