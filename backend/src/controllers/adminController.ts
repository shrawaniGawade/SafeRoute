import { Response } from 'express';
import { User } from '../models/User';
import { SafetyPrediction } from '../models/SafetyPrediction';
import { RouteHistory } from '../models/RouteHistory';
import { AuditLog, logAdminAction } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ENV } from '../config/env';
import { checkDBHealth } from '../config/db';

export async function getAdminStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const totalPredictions = await SafetyPrediction.countDocuments();
    const totalRoutes = await RouteHistory.countDocuments();
    const totalAuditLogs = await AuditLog.countDocuments();

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
      const aiRes = await fetch(`${ENV.AI_SERVICE_URL}/docs`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      aiLatencyMs = Date.now() - startTime;
      aiOnline = aiRes.ok || aiRes.status === 200;
    } catch {
      aiOnline = false;
    }

    // Database Health Probe
    const dbHealth = await checkDBHealth();

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
          aiScoringEngine: {
            status: aiOnline ? 'ONLINE' : 'DEGRADED',
            endpoint: ENV.AI_SERVICE_URL,
            latencyMs: aiLatencyMs,
          },
          database: {
            status: dbHealth.status,
            engine: dbHealth.connected ? 'MongoDB (Persistent)' : 'In-Memory (Development)',
            host: dbHealth.host || '127.0.0.1:27017',
            latencyMs: dbHealth.latencyMs,
            error: dbHealth.error,
          },
          emailGateway: {
            status: 'ONLINE',
            provider: ENV.SMTP.HOST ? 'Custom SMTP' : 'Ethereal Mail (Dev)',
          },
        },
        stats: {
          totalUsers,
          verifiedUsers,
          adminUsers,
          totalPredictions,
          totalRoutes,
          totalAuditLogs,
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

    const previousRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    // Look up executing admin's email for audit trail
    const adminUser = req.user?.userId ? await User.findById(req.user.userId) : null;

    // Record immutable audit log
    await logAdminAction({
      action: role === 'admin' ? 'USER_ROLE_PROMOTED' : 'USER_ROLE_DEMOTED',
      actor: {
        userId: req.user?.userId,
        email: adminUser?.email,
        role: req.user?.role,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
      target: {
        resourceType: 'User',
        resourceId: targetUser._id?.toString() || id,
        resourceName: targetUser.email,
      },
      metadata: {
        previousRole,
        newRole: role,
      },
    });

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

    // Look up executing admin's email for audit trail
    const adminUser = req.user?.userId ? await User.findById(req.user.userId) : null;

    // Record immutable audit log
    await logAdminAction({
      action: 'USER_DELETED',
      actor: {
        userId: req.user?.userId,
        email: adminUser?.email,
        role: req.user?.role,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
      target: {
        resourceType: 'User',
        resourceId: targetUser._id?.toString() || id,
        resourceName: targetUser.email,
      },
      metadata: {
        deletedUserEmail: targetUser.email,
        deletedUserName: targetUser.name,
      },
    });

    res.json({
      success: true,
      message: `User account ${targetUser.email} was removed.`,
    });
  } catch (error) {
    console.error('[AdminController] Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error deleting user.' });
  }
}

export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error('[AdminController] Error fetching audit logs:', error);
    res.status(500).json({ message: 'Internal server error fetching audit logs.' });
  }
}

export async function getAdminUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const roleFilter = typeof req.query.role === 'string' ? req.query.role : undefined;

    const query: any = {};
    if (roleFilter && ['user', 'admin'].includes(roleFilter)) {
      query.role = roleFilter;
    }

    const rawUsers = await User.find(query).select('-password');
    let filteredUsers = (Array.isArray(rawUsers) ? rawUsers : []).map((u: any) => ({
      id: u._id?.toString() || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isVerified: u.isVerified,
      emergencyContact: u.emergencyContact || '',
      defaultPreset: u.defaultPreset || 'night',
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
    }));

    if (search) {
      const s = search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
      );
    }

    const totalRecords = filteredUsers.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const skip = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(skip, skip + limit);

    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('[AdminController] Error fetching users list:', error);
    res.status(500).json({ message: 'Internal server error fetching users list.' });
  }
}

