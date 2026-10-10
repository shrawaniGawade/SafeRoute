import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';
import { getAdminStats, toggleUserRole, deleteUser } from '../controllers/adminController';

const router = Router();

// Protect all admin routes with authentication and admin role requirement
router.use(requireAuth, requireAdmin);

router.get('/stats', getAdminStats);
router.patch('/users/:id/role', toggleUserRole);
router.delete('/users/:id', deleteUser);

export default router;
