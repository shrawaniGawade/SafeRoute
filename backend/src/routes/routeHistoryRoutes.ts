import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware';
import {
  evaluateAndSavePrediction,
  saveRouteHistory,
  getUserRouteHistory,
  deleteUserRouteHistory,
} from '../controllers/routeHistoryController';

const router = Router();

// Evaluate AI prediction and automatically persist SafetyPrediction document
router.post('/predict', optionalAuth, evaluateAndSavePrediction);

// Persistent Route History with User Ownership
router.post('/history', requireAuth, saveRouteHistory);
router.get('/history', requireAuth, getUserRouteHistory);
router.delete('/history/:id', requireAuth, deleteUserRouteHistory);

export default router;
