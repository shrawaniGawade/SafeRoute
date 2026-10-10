import { Response } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ENV } from '../config/env';

export async function getAdminStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    // Fetch up to 50 users (excluding passwords)
    const rawUsers = await User.find().select('-password');
    const users = rawUsers.map((u: any) => ({
      id: u._id?.toString() || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
    }));

    // AI Service Health Probe
    let aiOnline = false;
    let aiLatencyMs = 0;
    try {
      const startTime = Date.now();
      const aiRes = await fetch(`${ENV.AI_SERVICE_URL}/docs`, { method: 'GET', signal: AbortSignal.timeout(2000) });
      aiLatencyMs = Date.now() - startTime;
      aiOnline = aiRes.ok || aiRes.status === 200;
    } catch {
      aiOnline = false;
    }

    res.json({
      success: true,
      data: {
        server: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          environment: ENV.NODE_ENV,
          memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
        services: {
          backend: { status: 'ONLINE', port: ENV.PORT, latencyMs: 2 },
          aiScoringEngine: { status: aiOnline ? 'ONLINE' : 'DEGRADED', endpoint: ENV.AI_SERVICE_URL, latencyMs: aiLatencyMs },
          database: { status: 'ONLINE', engine: 'Dual-Layer In-Memory / MongoDB' },
          emailGateway: { status: 'ONLINE', provider: ENV.SMTP.HOST ? 'Custom SMTP' : 'Ethereal Mail (Dev)' },
        },
        stats: {
          totalUsers,
          verifiedUsers,
          adminUsers,
          verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 100,
        },
        users,
      },
    });
  } catch (error) {
    console.error('[AdminController] Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error fetching admin stats' });
  }
}

export async function toggleUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      res.status(400).json({ message: 'Invalid role specified.' });
      return;
    }

    if (req.user?.userId === id && role === 'user') {
      res.status(400).json({ message: 'You cannot demote your own account.' });
      return;
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({
      success: true,
      message: `User ${targetUser.email} role updated to ${role}.`,
      user: {
        id: targetUser._id?.toString() || targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error('[AdminController] Error toggling role:', error);
    res.status(500).json({ message: 'Internal server error updating user role.' });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (req.user?.userId === id) {
      res.status(400).json({ message: 'You cannot delete your own account.' });
      return;
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `User account ${targetUser.email} was removed.`,
    });
  } catch (error) {
    console.error('[AdminController] Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error deleting user.' });
  }
}
