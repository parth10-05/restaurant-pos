import { Router } from 'express';
import { floorController } from '../controllers/floor.controller.js';
import { tableController } from '../controllers/table.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

// Floor routes
router.get('/floors', floorController.getAll);
router.get('/floors/:id', floorController.getById);
router.post('/floors', floorController.create);
router.put('/floors/:id', floorController.update);
router.delete('/floors/:id', floorController.delete);

// Table routes
router.get('/floors/:floorId/tables', tableController.getByFloor);
router.post('/floors/:floorId/tables', tableController.create);
router.get('/tables/:id', tableController.getById);
router.put('/tables/:id', tableController.update);
router.delete('/tables/:id', tableController.delete);

export default router;