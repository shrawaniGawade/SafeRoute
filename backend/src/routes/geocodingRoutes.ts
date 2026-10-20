import { Router } from 'express';
import { geocode } from '../controllers/geocodingController';
import { geocodeLimiter } from '../middleware/rateLimiter';

const router = Router();

// GET /api/geocode?q=&limit=
router.get('/', geocodeLimiter, geocode);

export default router;
