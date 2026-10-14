import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';
import { predictSafetySchema } from '../validators/safetyValidators';
import { predict, getHistory, getPredictionById } from '../controllers/safetyController';

const router = Router();

// POST /api/safety/predict
router.post('/predict', optionalAuth, validateBody(predictSafetySchema), predict);

// GET /api/safety/history (paginated, user ownership enforced)
router.get('/history', requireAuth, getHistory);

// GET /api/safety/history/:id (single record with ownership validation)
router.get('/history/:id', requireAuth, getPredictionById);

export default router;
