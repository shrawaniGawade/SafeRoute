import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';
import { predictSafetySchema, evaluateSafetyScoreSchema } from '../validators/safetyValidators';
import { predict, evaluateScore, getHistory, getPredictionById } from '../controllers/safetyController';
import { geocode } from '../controllers/geocodingController';
import { geocodeLimiter } from '../middleware/rateLimiter';

const router = Router();

// GET /api/safety/geocode?q= (Autocomplete / Forward geocoding with rate limit)
router.get('/geocode', geocodeLimiter, geocode);

// POST /api/safety/predict
router.post('/predict', optionalAuth, validateBody(predictSafetySchema), predict);

// POST /api/safety/score (ISSUE-13: 6-factor safety score engine)
router.post('/score', optionalAuth, validateBody(evaluateSafetyScoreSchema), evaluateScore);

// GET /api/safety/history (paginated, user ownership enforced)
router.get('/history', requireAuth, getHistory);

// GET /api/safety/history/:id (single record with ownership validation)
router.get('/history/:id', requireAuth, getPredictionById);

export default router;
