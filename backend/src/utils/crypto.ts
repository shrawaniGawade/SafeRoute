import crypto from 'crypto';

/**
 * Generates a cryptographically secure numeric OTP of specified length.
 * Default length is 6 digits.
 */
export function generateNumericOtp(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const otpNumber = crypto.randomInt(min, max + 1);
  return otpNumber.toString();
}

/**
 * Computes a SHA-256 hash for secure storage and comparison of sensitive tokens / OTPs.
 */
export function hashValue(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

/**
 * Generates a cryptographically random hexadecimal string (e.g., for refresh tokens or families).
 */
export function generateRandomToken(bytes: number = 40): string {
  return crypto.randomBytes(bytes).toString('hex');
}
