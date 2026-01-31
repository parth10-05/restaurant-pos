import { Router } from 'express';
import { sessionController } from '../controllers/session.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// All session routes require authentication
router.use(authMiddleware);

router.post('/open', sessionController.openSession);
router.post('/close', sessionController.closeSession);
router.get('/current', sessionController.getCurrentSession);

export default router;