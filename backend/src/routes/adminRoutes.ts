import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';
import {
  getAdminStats,
  getAdminUsers,
  toggleUserRole,
  deleteUser,
  getAuditLogs,
} from '../controllers/adminController';

const router = Router();

// Protect all admin routes with authentication and admin role requirement
router.use(requireAuth, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', toggleUserRole);
router.delete('/users/:id', deleteUser);
router.get('/audit-logs', getAuditLogs);

export default router;
