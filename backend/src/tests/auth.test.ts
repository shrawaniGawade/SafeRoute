import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { generateNumericOtp, hashValue, generateRandomToken } from '../utils/crypto';
import { registerSchema, loginSchema, verifyOtpSchema } from '../utils/validators';

describe('SafeRoute Cryptographic & Validation Utilities', () => {
  test('generateNumericOtp produces valid 6-digit numeric string', () => {
    for (let i = 0; i < 20; i++) {
      const otp = generateNumericOtp(6);
      assert.equal(otp.length, 6, 'OTP must be 6 characters');
      assert.match(otp, /^\d{6}$/, 'OTP must be strictly numeric');
      const num = parseInt(otp, 10);
      assert.ok(num >= 100000 && num <= 999999, 'OTP must fall within range');
    }
  });

  test('hashValue computes consistent SHA-256 digests', () => {
    const input = '123456';
    const hash1 = hashValue(input);
    const hash2 = hashValue(input);
    assert.equal(hash1, hash2, 'Identical inputs must yield identical digests');
    assert.equal(hash1.length, 64, 'SHA-256 hex digest must be 64 characters');
  });

  test('generateRandomToken generates unique hex strings', () => {
    const token1 = generateRandomToken(32);
    const token2 = generateRandomToken(32);
    assert.notEqual(token1, token2, 'Random tokens must be unique');
    assert.equal(token1.length, 64, '32 bytes hex should be 64 chars');
  });

  test('bcrypt hashes and verifies password correctly', async () => {
    const password = 'StrongPassword@123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const match = await bcrypt.compare(password, hash);
    const mismatch = await bcrypt.compare('WrongPassword@123', hash);

    assert.equal(match, true, 'Valid password must match hash');
    assert.equal(mismatch, false, 'Invalid password must not match hash');
  });

  test('registerSchema accepts valid strong passwords and rejects weak ones', () => {
    const validData = {
      name: 'Safe Traveler',
      email: 'traveler@saferoute.com',
      password: 'SafePassword@2026',
      confirmPassword: 'SafePassword@2026',
    };

    const parseResult = registerSchema.safeParse(validData);
    assert.equal(parseResult.success, true, 'Valid registration payload must pass validation');

    const weakPasswordData = {
      ...validData,
      password: 'weak',
      confirmPassword: 'weak',
    };
    const weakResult = registerSchema.safeParse(weakPasswordData);
    assert.equal(weakResult.success, false, 'Weak password must fail validation');

    const mismatchedData = {
      ...validData,
      confirmPassword: 'DifferentPassword@2026',
    };
    const mismatchResult = registerSchema.safeParse(mismatchedData);
    assert.equal(mismatchResult.success, false, 'Mismatched passwords must fail validation');
  });

  test('verifyOtpSchema validates OTP length and format', () => {
    const validOtp = {
      email: 'user@example.com',
      otp: '739201',
      purpose: 'EMAIL_VERIFICATION',
    };
    assert.equal(verifyOtpSchema.safeParse(validOtp).success, true);

    const invalidLength = {
      email: 'user@example.com',
      otp: '123',
      purpose: 'EMAIL_VERIFICATION',
    };
    assert.equal(verifyOtpSchema.safeParse(invalidLength).success, false);

    const nonNumeric = {
      email: 'user@example.com',
      otp: '12AB56',
      purpose: 'EMAIL_VERIFICATION',
    };
    assert.equal(verifyOtpSchema.safeParse(nonNumeric).success, false);
  });
});
