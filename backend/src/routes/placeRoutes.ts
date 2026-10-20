import { Router } from 'express';
import { optionalAuth } from '../middleware/authMiddleware';
import { geocodeLimiter } from '../middleware/rateLimiter';
import {
  searchPlaces,
  createCustomPlace,
  getCustomPlaces,
  reportCustomPlace,
  getNearbyPlaces,
  createHazardReport,
  getHazardReports,
  reverseGeocodePlace,
} from '../controllers/placeController';

const router = Router();

// GET /api/places/search - Smart multi-provider local place search
router.get('/search', geocodeLimiter, searchPlaces);

// POST /api/places/custom - Add a missing place / community manual pin
router.post('/custom', optionalAuth, createCustomPlace);

// GET /api/places/custom - List custom places
router.get('/custom', getCustomPlaces);

// POST /api/places/custom/:id/report - Report incorrect pin or location
router.post('/custom/:id/report', optionalAuth, reportCustomPlace);

// GET /api/places/nearby - Discover nearby safety hubs, emergency facilities, gates
router.get('/nearby', getNearbyPlaces);

// GET /api/places/reverse - Reverse geocode [lat, lng] to place name
router.get('/reverse', reverseGeocodePlace);

// POST /api/places/hazards - Submit community road hazard
router.post('/hazards', optionalAuth, createHazardReport);

// GET /api/places/hazards - Retrieve active road hazards
router.get('/hazards', getHazardReports);

export default router;
