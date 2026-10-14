import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';
import { updateProfileSchema } from '../validators/userValidators';
import { getProfile, updateProfile } from '../controllers/userController';

const router = Router();

// Protect all user profile endpoints
router.use(requireAuth);

// GET /api/users/me
router.get('/me', getProfile);

// PATCH /api/users/me
router.patch('/me', validateBody(updateProfileSchema), updateProfile);

export default router;
