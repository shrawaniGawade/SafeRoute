import { Router } from 'express';
import { geocode } from '../controllers/geocodingController';

const router = Router();

// GET /api/geocode?q=&limit=
router.get('/', geocode);

export default router;
