import { Request, Response } from 'express';
import { User } from '../models/User';
import { Otp } from '../models/Otp';
import { ENV } from '../config/env';
import { generateNumericOtp, hashValue } from '../utils/crypto';
import { sendOtpEmail } from '../services/emailService';
import {
  createTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../services/tokenService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const OTP_EXPIRY_MINUTES = 10;
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

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.isVerified) {
      res.status(409).json({
        message: 'An account with this email address already exists. Please log in.',
      });
      return;
    }

    // Account exists but was never verified -> update info and issue fresh OTP
    existingUser.name = name;
    existingUser.password = password; // Will be hashed by pre-save hook
    await existingUser.save();
  } else {
    // Create new unverified user
    await User.create({
      name,
      email,
      password,
      isVerified: false,
    });
  }

  // Generate OTP
  const rawOtp = generateNumericOtp(6);
  const hashedOtp = hashValue(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Remove previous unverified OTPs and save new one
  await Otp.deleteMany({ email, purpose: 'EMAIL_VERIFICATION' });
  await Otp.create({
    email,
    hashedOtp,
    purpose: 'EMAIL_VERIFICATION',
    expiresAt,
  });

  // Send verification email
  const emailResult = await sendOtpEmail(email, rawOtp, 'EMAIL_VERIFICATION');

  res.status(201).json({
    message: 'Registration initiated! Please enter the 6-digit verification code sent to your email.',
    email,
    devOtp: ENV.IS_PRODUCTION ? undefined : rawOtp,
    emailPreviewUrl: emailResult.previewUrl,
  });
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const { email, otp, purpose } = req.body;

  const otpRecord = await Otp.findOne({ email, purpose });

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

  // Verify hash
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
    // Code matches! Remove the used OTP
    await Otp.deleteOne({ _id: otpRecord._id });
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save();

    // Generate authenticated session tokens
    const tokens = await createTokens(user._id.toString(), user.role);
    setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

    res.status(200).json({
      message: 'Account verified successfully!',
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

  if (purpose === 'PASSWORD_RESET') {
    res.status(200).json({
      message: 'Verification code confirmed. You may now reset your password.',
      verified: true,
      email,
    });
    return;
  }
}

export async function resendOtp(req: Request, res: Response): Promise<void> {
  const { email, purpose } = req.body;

  // Check cooldown on existing OTP
  const existingOtp = await Otp.findOne({ email, purpose });
  if (existingOtp) {
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

  await Otp.deleteMany({ email, purpose });
  await Otp.create({
    email,
    hashedOtp,
    purpose,
    expiresAt,
  });

  const emailResult = await sendOtpEmail(email, rawOtp, purpose);

  res.status(200).json({
    message: 'A new verification code has been dispatched to your email.',
    devOtp: ENV.IS_PRODUCTION ? undefined : rawOtp,
    emailPreviewUrl: emailResult.previewUrl,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({
      message: 'Invalid email or password.',
    });
    return;
  }

  if (!user.isVerified) {
    // Dispatch fresh verification code automatically
    const rawOtp = generateNumericOtp(6);
    const hashedOtp = hashValue(rawOtp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.deleteMany({ email, purpose: 'EMAIL_VERIFICATION' });
    await Otp.create({
      email,
      hashedOtp,
      purpose: 'EMAIL_VERIFICATION',
      expiresAt,
    });

    const emailResult = await sendOtpEmail(email, rawOtp, 'EMAIL_VERIFICATION');

    res.status(403).json({
      message: 'Your account is pending email verification. A new 6-digit code has been sent.',
      unverified: true,
      email: user.email,
      devOtp: ENV.IS_PRODUCTION ? undefined : rawOtp,
      emailPreviewUrl: emailResult.previewUrl,
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

  const user = await User.findOne({ email });

  // Security best practice: Prevent user enumeration by returning identical generic message
  if (user) {
    const rawOtp = generateNumericOtp(6);
    const hashedOtp = hashValue(rawOtp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.deleteMany({ email, purpose: 'PASSWORD_RESET' });
    await Otp.create({
      email,
      hashedOtp,
      purpose: 'PASSWORD_RESET',
      expiresAt,
    });

    const emailResult = await sendOtpEmail(email, rawOtp, 'PASSWORD_RESET');
    res.status(200).json({
      message: 'If an account exists with this email address, a password reset code has been sent.',
      devOtp: ENV.IS_PRODUCTION ? undefined : rawOtp,
      emailPreviewUrl: emailResult.previewUrl,
    });
    return;
  }

  res.status(200).json({
    message: 'If an account exists with this email address, a password reset code has been sent.',
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, otp, newPassword } = req.body;

  const otpRecord = await Otp.findOne({ email, purpose: 'PASSWORD_RESET' });

  if (!otpRecord) {
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

  const user = await User.findOne({ email });
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
