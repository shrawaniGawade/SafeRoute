import { Router } from 'express';
import {
  register,
  sendOtp,
  verifyOtp,
  resendOtp,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
} from '../controllers/authController';
import { validateBody } from '../middleware/validate';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/authMiddleware';
import {
  registerSchema,
  sendOtpSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validators';

const router = Router();

// Registration and OTP Verification
router.post('/send-otp', otpLimiter, validateBody(sendOtpSchema), sendOtp);
router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/verify-otp', otpLimiter, validateBody(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', otpLimiter, validateBody(resendOtpSchema), resendOtp);

// Login and Silent Session Refresh
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/refresh-token', refreshToken);

// Password Recovery
router.post('/forgot-password', otpLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', otpLimiter, validateBody(resetPasswordSchema), resetPassword);

// Session Termination & Current Profile
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
