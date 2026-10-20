import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name cannot exceed 60 characters')
      .optional(),
    emergencyContact: z
      .string()
      .trim()
      .max(30, 'Emergency contact phone number cannot exceed 30 characters')
      .optional(),
    defaultPreset: z
      .enum(['night', 'commute', 'maximum', 'custom'])
      .optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'New password must contain at least one numeric digit')
      .regex(/[^A-Za-z0-9]/, 'New password must contain at least one special character')
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.newPassword || !!data.currentPassword,
    {
      message: 'Current password is required to set a new password',
      path: ['currentPassword'],
    }
  )
  .refine(
    (data) => !data.newPassword || data.newPassword === data.confirmPassword,
    {
      message: 'New passwords do not match',
      path: ['confirmPassword'],
    }
  );
