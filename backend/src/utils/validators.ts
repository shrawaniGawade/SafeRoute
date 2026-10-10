import { z } from 'zod';

export const passwordComplexityRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,100}$/;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(60, 'Name cannot exceed 60 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(100, 'Password is too long')
      .regex(
        passwordComplexityRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must be numeric'),
  purpose: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET']),
});

export const resendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  purpose: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET']),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    otp: z
      .string()
      .trim()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must be numeric'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .max(100, 'Password is too long')
      .regex(
        passwordComplexityRegex,
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });
