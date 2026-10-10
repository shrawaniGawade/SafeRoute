import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { RefreshToken } from '../models/RefreshToken';
import { generateRandomToken, hashValue } from '../utils/crypto';

export interface TokenUserPayload {
  userId: string;
  role: string;
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

const REFRESH_TOKEN_DAYS = 7;

/**
 * Creates a pair of Access and Refresh tokens.
 * Saves the hashed refresh token into MongoDB with rotation family.
 */
export async function createTokens(
  userId: string,
  role: string,
  existingFamily?: string
): Promise<GeneratedTokens> {
  const payload: TokenUserPayload = { userId, role };

  // Sign short-lived Access Token
  const accessToken = jwt.sign(payload, ENV.JWT.ACCESS_SECRET, {
    expiresIn: ENV.JWT.ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  // Generate random raw Refresh Token string and family
  const rawRefreshToken = generateRandomToken(40);
  const tokenHash = hashValue(rawRefreshToken);
  const family = existingFamily || generateRandomToken(16);

  const refreshTokenExpiresAt = new Date(
    Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
  );

  function toObjectId(id: any) {
    if (typeof id === 'string' && mongoose.isValidObjectId(id)) {
      return new mongoose.Types.ObjectId(id);
    }
    return id;
  }

  // Store in database
  await RefreshToken.create({
    userId: toObjectId(userId),
    tokenHash,
    family,
    isRevoked: false,
    expiresAt: refreshTokenExpiresAt,
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    refreshTokenExpiresAt,
  };
}

/**
 * Rotates a refresh token.
 * If an already-revoked refresh token is presented, detects compromise and invalidates the entire token family.
 */
export async function rotateRefreshToken(
  rawRefreshToken: string
): Promise<{ tokens: GeneratedTokens; userId: string; role: string } | null> {
  if (!rawRefreshToken) return null;

  const tokenHash = hashValue(rawRefreshToken);
  const foundToken: any = await RefreshToken.findOne({ tokenHash }).populate('userId');

  if (!foundToken || !foundToken.userId) {
    return null;
  }

  // Token reuse / compromise detection
  if (foundToken.isRevoked) {
    console.warn(
      `[Security Alert] Reused/revoked refresh token detected for family: ${foundToken.family}. Revoking entire family!`
    );
    await RefreshToken.updateMany(
      { family: foundToken.family },
      { $set: { isRevoked: true } }
    );
    return null;
  }

  // Check expiration
  if (foundToken.expiresAt < new Date()) {
    foundToken.isRevoked = true;
    await foundToken.save();
    return null;
  }

  // Invalidate the consumed refresh token
  foundToken.isRevoked = true;
  await foundToken.save();

  // Issue new tokens using the same family
  const user = foundToken.userId;
  const newTokens = await createTokens(
    user._id.toString(),
    user.role,
    foundToken.family
  );

  return {
    tokens: newTokens,
    userId: user._id.toString(),
    role: user.role,
  };
}

/**
 * Revokes a specific refresh token (used during logout).
 */
export async function revokeRefreshToken(rawRefreshToken: string): Promise<void> {
  if (!rawRefreshToken) return;
  const tokenHash = hashValue(rawRefreshToken);
  await RefreshToken.updateOne({ tokenHash }, { $set: { isRevoked: true } });
}

/**
 * Revokes all refresh tokens for a user (used during password reset).
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  const targetId =
    typeof userId === 'string' && mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
  await RefreshToken.updateMany(
    { userId: targetId },
    { $set: { isRevoked: true } }
  );
}

/**
 * Verifies an Access Token JWT and extracts user payload.
 */
export function verifyAccessToken(token: string): TokenUserPayload | null {
  try {
    const decoded = jwt.verify(token, ENV.JWT.ACCESS_SECRET) as TokenUserPayload;
    return decoded;
  } catch {
    return null;
  }
}
