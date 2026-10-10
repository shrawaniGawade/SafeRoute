import rateLimit from 'express-rate-limit';

/**
 * Standard limiter for general auth endpoints (login, register).
 * Max 15 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Stricter limiter for sensitive operations like OTP verification, resend, and forgot password.
 * Max 6 attempts per 15 minutes per IP.
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many OTP requests. Please wait a few minutes before trying again.',
  },
});
