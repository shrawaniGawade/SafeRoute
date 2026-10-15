import { Request, Response } from 'express';
import { User } from '../models/User';
import { Otp } from '../models/Otp';
import { ENV } from '../config/env';
import { generateNumericOtp, hashValue, generateRandomToken } from '../utils/crypto';
import { sendOtpEmail } from '../services/emailService';
import {
  createTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../services/tokenService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function setRefreshTokenCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: ENV.IS_PRODUCTION,
    sameSite: ENV.IS_PRODUCTION ? 'strict' : 'lax',
    expires: expiresAt,
    path: '/',
  });
}

/**
 * POST /api/auth/send-otp
 * Generates a 6-digit cryptographic OTP and dispatches it via Resend or SMTP.
 */
export async function sendOtp(req: Request, res: Response): Promise<void> {
  const { email, purpose = 'EMAIL_VERIFICATION' } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // If registering, prevent sending OTP to already verified registered email
  if (purpose === 'EMAIL_VERIFICATION') {
    const existing = await User.findOne({ email: normalizedEmail, isVerified: true });
    if (existing) {
      res.status(409).json({
        message: 'An account with this email address already exists. Please log in.',
      });
      return;
    }
  }

  // Check resend cooldown
  const existingOtp = await Otp.findOne({ email: normalizedEmail, purpose });
  if (existingOtp && existingOtp.createdAt) {
    const elapsedSeconds = (Date.now() - existingOtp.createdAt.getTime()) / 1000;
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      const waitTime = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds);
      res.status(429).json({
        message: `Please wait ${waitTime} seconds before requesting a new verification code.`,
      });
      return;
    }
  }

  // Generate 6-digit cryptographic numeric OTP
  const rawOtp = generateNumericOtp(6);
  const hashedOtp = hashValue(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any previous OTPs for this email and purpose
  await Otp.deleteMany({ email: normalizedEmail, purpose });
  await Otp.create({
    email: normalizedEmail,
    hashedOtp,
    purpose,
    attempts: 0,
    verified: false,
    expiresAt,
  });

  // Send real email via Resend or SMTP
  try {
    await sendOtpEmail(normalizedEmail, rawOtp, purpose);
  } catch (err: any) {
    // Invalidate OTP on delivery failure
    await Otp.deleteMany({ email: normalizedEmail, purpose });
    res.status(503).json({
      message: err?.message || 'Failed to deliver verification code. Please check email provider configuration.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Verification code sent. Please check your inbox and spam folder.',
    email: normalizedEmail,
  });
}

/**
 * POST /api/auth/register
 * Creates a new user account with role 'user'. If a verificationToken is supplied,
 * enforces that the email was verified within the session window.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, verificationToken } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser && existingUser.isVerified) {
    res.status(409).json({
      message: 'An account with this email address already exists. Please log in.',
    });
    return;
  }

  // Pre-verification mode (user verified email first via /send-otp & /verify-otp)
  if (verificationToken) {
    const session = await Otp.findOne({
      email: normalizedEmail,
      purpose: 'EMAIL_VERIFICATION',
      verified: true,
    });

    if (
      !session ||
      session.verificationTokenHash !== hashValue(verificationToken) ||
      session.expiresAt < new Date()
    ) {
      res.status(403).json({
        message: 'Email verification is required or session expired. Please verify your email first.',
      });
      return;
    }

    // Invalidate the verification session (strictly single-use)
    await Otp.deleteMany({ email: normalizedEmail, purpose: 'EMAIL_VERIFICATION' });

    let user;
    if (existingUser) {
      existingUser.name = name.trim();
      existingUser.password = password;
      existingUser.isVerified = true;
      existingUser.role = 'user'; // Never trust client-supplied role
      await existingUser.save();
      user = existingUser;
    } else {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: 'user', // Always standard user
        isVerified: true,
      });
    }

    const tokens = await createTokens(user._id.toString(), user.role);
    setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: true,
      },
      accessToken: tokens.accessToken,
    });
    return;
  }

  // Fallback for direct registration flow (creates unverified account & dispatches code)
  if (existingUser) {
    existingUser.name = name.trim();
    existingUser.password = password;
    await existingUser.save();
  } else {
    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'user',
      isVerified: false,
    });
  }

  const rawOtp = generateNumericOtp(6);
  const hashedOtp = hashValue(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.deleteMany({ email: normalizedEmail, purpose: 'EMAIL_VERIFICATION' });
  await Otp.create({
    email: normalizedEmail,
    hashedOtp,
    purpose: 'EMAIL_VERIFICATION',
    expiresAt,
  });

  try {
    await sendOtpEmail(normalizedEmail, rawOtp, 'EMAIL_VERIFICATION');
  } catch (err: any) {
    await Otp.deleteMany({ email: normalizedEmail, purpose: 'EMAIL_VERIFICATION' });
    res.status(503).json({
      message: err?.message || 'Failed to deliver verification code. Please check email provider configuration.',
    });
    return;
  }

  res.status(201).json({
    message: 'Registration initiated! Please enter the 6-digit verification code sent to your email.',
    email: normalizedEmail,
  });
}

/**
 * POST /api/auth/verify-otp
 * Validates the 6-digit OTP against persistent storage, enforcing 5-minute expiry and max 5 attempts.
 */
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const { email, otp, purpose = 'EMAIL_VERIFICATION' } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const otpRecord = await Otp.findOne({ email: normalizedEmail, purpose });

  if (!otpRecord) {
    res.status(400).json({
      message: 'Invalid or expired verification code. Please request a new one.',
    });
    return;
  }

  // Check attempt limiter
  if (otpRecord.attempts >= 5) {
    await Otp.deleteOne({ _id: otpRecord._id });
    res.status(400).json({
      message: 'Maximum verification attempts exceeded. Please request a new code.',
    });
    return;
  }

  // Verify SHA-256 hash
  const incomingHash = hashValue(otp);
  if (incomingHash !== otpRecord.hashedOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remaining = 5 - otpRecord.attempts;
    res.status(400).json({
      message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    });
    return;
  }

  if (purpose === 'EMAIL_VERIFICATION') {
    // Generate secure session verification token
    const verificationToken = generateRandomToken(32);
    const verificationTokenHash = hashValue(verificationToken);

    // Update OTP record to marked as verified session valid for 15 minutes
    otpRecord.hashedOtp = '';
    otpRecord.verified = true;
    otpRecord.verificationTokenHash = verificationTokenHash;
    otpRecord.verifiedAt = new Date();
    otpRecord.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await otpRecord.save();

    // Check if an existing unverified user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();

      const tokens = await createTokens(user._id.toString(), user.role);
      setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

      res.status(200).json({
        success: true,
        message: 'Account verified successfully!',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: true,
        },
        accessToken: tokens.accessToken,
        verificationToken,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      verificationToken,
      email: normalizedEmail,
    });
    return;
  }

  if (purpose === 'PASSWORD_RESET') {
    await Otp.deleteOne({ _id: otpRecord._id });
    res.status(200).json({
      success: true,
      message: 'Verification code confirmed. You may now reset your password.',
      verified: true,
      email: normalizedEmail,
    });
    return;
  }
}

/**
 * POST /api/auth/resend-otp
 */
export async function resendOtp(req: Request, res: Response): Promise<void> {
  const { email, purpose = 'EMAIL_VERIFICATION' } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // Check cooldown on existing OTP
  const existingOtp = await Otp.findOne({ email: normalizedEmail, purpose });
  if (existingOtp && existingOtp.createdAt) {
    const elapsedSeconds = (Date.now() - existingOtp.createdAt.getTime()) / 1000;
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      const waitTime = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds);
      res.status(429).json({
        message: `Please wait ${waitTime} seconds before requesting a new code.`,
      });
      return;
    }
  }

  const rawOtp = generateNumericOtp(6);
  const hashedOtp = hashValue(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.deleteMany({ email: normalizedEmail, purpose });
  await Otp.create({
    email: normalizedEmail,
    hashedOtp,
    purpose,
    attempts: 0,
    verified: false,
    expiresAt,
  });

  try {
    await sendOtpEmail(normalizedEmail, rawOtp, purpose);
  } catch (err: any) {
    await Otp.deleteMany({ email: normalizedEmail, purpose });
    res.status(503).json({
      message: err?.message || 'Failed to deliver verification code. Please check email provider configuration.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'A new verification code has been dispatched to your email.',
  });
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({
      message: 'Invalid email or password.',
    });
    return;
  }

  if (!user.isVerified) {
    res.status(403).json({
      message: 'Your account is pending email verification. Please verify your email before signing in.',
      unverified: true,
      email: user.email,
    });
    return;
  }

  user.lastLogin = new Date();
  await user.save();

  const tokens = await createTokens(user._id.toString(), user.role);
  setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

  res.status(200).json({
    message: 'Welcome back!',
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: true,
    },
    accessToken: tokens.accessToken,
  });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const rawRefreshToken = req.cookies?.refreshToken;

  if (!rawRefreshToken) {
    res.status(401).json({
      message: 'No refresh token provided in session.',
      code: 'NO_REFRESH_TOKEN',
    });
    return;
  }

  const rotationResult = await rotateRefreshToken(rawRefreshToken);

  if (!rotationResult) {
    // Clear cookie on invalid session
    res.clearCookie('refreshToken', { path: '/' });
    res.status(401).json({
      message: 'Session has expired or is invalid. Please log in again.',
      code: 'SESSION_EXPIRED',
    });
    return;
  }

  // Set rotated refresh token cookie
  setRefreshTokenCookie(
    res,
    rotationResult.tokens.refreshToken,
    rotationResult.tokens.refreshTokenExpiresAt
  );

  res.status(200).json({
    accessToken: rotationResult.tokens.accessToken,
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });

  // Security best practice: Prevent user enumeration by returning identical generic message
  if (user) {
    const rawOtp = generateNumericOtp(6);
    const hashedOtp = hashValue(rawOtp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.deleteMany({ email: normalizedEmail, purpose: 'PASSWORD_RESET' });
    await Otp.create({
      email: normalizedEmail,
      hashedOtp,
      purpose: 'PASSWORD_RESET',
      expiresAt,
    });

    try {
      await sendOtpEmail(normalizedEmail, rawOtp, 'PASSWORD_RESET');
    } catch (err) {
      console.error('[AuthController] Failed to send password reset OTP:', err);
    }

    res.status(200).json({
      message: 'If an account exists with this email address, a password reset code has been sent.',
    });
    return;
  }

  res.status(200).json({
    message: 'If an account exists with this email address, a password reset code has been sent.',
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, otp, newPassword } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  const otpRecord = await Otp.findOne({ email: normalizedEmail, purpose: 'PASSWORD_RESET' });

  if (!otpRecord) {
    res.status(400).json({
      message: 'Invalid or expired password reset code. Please request a new code.',
    });
    return;
  }

  // Enforce code expiration check
  if (otpRecord.expiresAt && new Date() > new Date(otpRecord.expiresAt)) {
    await Otp.deleteOne({ _id: otpRecord._id });
    res.status(400).json({
      message: 'Invalid or expired password reset code. Please request a new code.',
    });
    return;
  }

  if (otpRecord.attempts >= 5) {
    await Otp.deleteOne({ _id: otpRecord._id });
    res.status(400).json({
      message: 'Maximum verification attempts exceeded. Please request a new code.',
    });
    return;
  }

  const incomingHash = hashValue(otp);
  if (incomingHash !== otpRecord.hashedOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remaining = 5 - otpRecord.attempts;
    res.status(400).json({
      message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    });
    return;
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  // Update password (pre-save hook hashes with fresh salt)
  user.password = newPassword;
  await user.save();

  // Clean up reset OTP
  await Otp.deleteOne({ _id: otpRecord._id });

  // Invalidate all active sessions across all devices for security
  await revokeAllUserTokens(user._id.toString());
  res.clearCookie('refreshToken', { path: '/' });

  res.status(200).json({
    message: 'Your password has been reset successfully. Please log in with your new password.',
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const rawRefreshToken = req.cookies?.refreshToken;
  if (rawRefreshToken) {
    await revokeRefreshToken(rawRefreshToken);
  }

  res.clearCookie('refreshToken', { path: '/' });
  res.status(200).json({
    message: 'Logged out successfully.',
  });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    res.status(404).json({ message: 'User profile not found.' });
    return;
  }

  res.status(200).json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
  });
}
