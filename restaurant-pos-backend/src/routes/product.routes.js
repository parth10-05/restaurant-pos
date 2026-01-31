import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { productController } from '../controllers/product.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

// Category routes
router.get('/categories', categoryController.getAll);
router.get('/categories/:id', categoryController.getById);
router.post('/categories', categoryController.create);
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.delete);

// Product routes
router.get('/products', productController.getAll);
router.get('/products/:id', productController.getById);
router.post('/products', productController.create);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.delete);

export default router;