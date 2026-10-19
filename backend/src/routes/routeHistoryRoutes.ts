import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware';
import {
  evaluateAndSavePrediction,
  saveRouteHistory,
  getUserRouteHistory,
  deleteUserRouteHistory,
} from '../controllers/routeHistoryController';
import { predict } from '../controllers/safetyController';

const router = Router();

// ISSUE-11 / FRD F2.2: Route Search and Safety Alternatives Evaluation
router.post('/search', optionalAuth, predict);

// Evaluate AI prediction and automatically persist SafetyPrediction document
router.post('/predict', optionalAuth, evaluateAndSavePrediction);

// Persistent Route History with User Ownership
router.post('/history', requireAuth, saveRouteHistory);
router.get('/history', requireAuth, getUserRouteHistory);
router.delete('/history/:id', requireAuth, deleteUserRouteHistory);

export default router;
