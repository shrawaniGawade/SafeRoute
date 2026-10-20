import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User profile not found.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user._id?.toString() || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        emergencyContact: user.emergencyContact || '',
        defaultPreset: user.defaultPreset || 'night',
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('[UserController] Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving user profile.',
      code: 'SERVER_ERROR',
    });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { name, emergencyContact, defaultPreset, currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User account not found.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    // 1. Update permitted non-sensitive fields
    if (name !== undefined) {
      user.name = name.trim();
    }
    if (emergencyContact !== undefined) {
      user.emergencyContact = emergencyContact.trim();
    }
    if (defaultPreset !== undefined) {
      user.defaultPreset = defaultPreset;
    }

    // 2. Handle Password Change if requested
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
          code: 'PASSWORD_REQUIRED',
        });
        return;
      }

      // Fetch user with password field to verify current password
      const fullUser = await User.findOne({ _id: userId }).select('+password');
      if (!fullUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const isCurrentMatch = await fullUser.comparePassword(currentPassword);
      if (!isCurrentMatch) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      // Set new password (pre-save hook will hash it)
      user.password = newPassword;
    }

    user.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'User profile updated successfully.',
      data: {
        id: user._id?.toString() || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        emergencyContact: user.emergencyContact || '',
        defaultPreset: user.defaultPreset || 'night',
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('[UserController] Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error updating user profile.',
      code: 'SERVER_ERROR',
    });
  }
}
