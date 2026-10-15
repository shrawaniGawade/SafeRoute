import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../server';
import { connectDB } from '../config/db';

let server: any;
let BASE_URL = '';

describe('SafeRoute Full Authentication E2E Flow', () => {
  let capturedOtp = '';
  const testUser = {
    name: 'Alex Johnson',
    email: `alex.johnson.${Date.now()}.${Math.random().toString(36).substring(2, 7)}@saferoute.test`,
    password: 'SafePass@2026',
    confirmPassword: 'SafePass@2026',
  };
  const newPassword = 'NewSecretPass@2026';
  let accessToken = '';
  let refreshTokenCookie = '';

  before(async () => {
    await connectDB();

    // Intercept console.log to capture generated OTP in tests
    const origLog = console.log;
    console.log = (...args: any[]) => {
      const line = args.join(' ');
      const match = line.match(/Code:\s*>>>\s*(\d{6})\s*<<</);
      if (match) {
        capturedOtp = match[1];
      }
      origLog(...args);
    };

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        BASE_URL = `http://127.0.0.1:${address.port}/api/auth`;
        resolve();
      });
    });
  });

  test('1. User Registration: POST /api/auth/register', async () => {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    const data = await res.json();
    assert.equal(res.status, 201, `Expected status 201, got ${res.status}: ${JSON.stringify(data)}`);
    assert.ok(data.message.includes('verification code'));
    assert.ok(capturedOtp.length === 6, 'Should have intercepted 6-digit OTP from email dispatch');
  });

  test('2. Verify OTP: POST /api/auth/verify-otp', async () => {
    const res = await fetch(`${BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        otp: capturedOtp,
        purpose: 'EMAIL_VERIFICATION',
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Expected status 200, got ${res.status}: ${JSON.stringify(data)}`);
    assert.ok(data.user.isVerified === true, 'User must be marked verified');
    assert.ok(data.accessToken, 'Must receive access token');
    accessToken = data.accessToken;

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      refreshTokenCookie = setCookie.split(';')[0];
    }
  });

  test('3. User Login: POST /api/auth/login', async () => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Expected status 200, got ${res.status}: ${JSON.stringify(data)}`);
    assert.equal(data.user.email, testUser.email);
    assert.ok(data.accessToken);

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      refreshTokenCookie = setCookie.split(';')[0];
    }
  });

  test('4. Fetch Current Profile: GET /api/auth/me', async () => {
    const res = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.user.email, testUser.email);
    assert.equal(data.user.name, testUser.name);
    assert.equal(data.user.isVerified, true);
  });

  test('4b. Silent Session Refresh with Token Rotation (RTR): POST /api/auth/refresh-token & /refresh', async () => {
    const oldCookie = refreshTokenCookie;
    const res = await fetch(`${BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        Cookie: oldCookie,
      },
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    assert.ok(data.accessToken, 'Must issue new access token');
    accessToken = data.accessToken;

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Must set rotated refresh token cookie');
    refreshTokenCookie = setCookie.split(';')[0];
    assert.notEqual(refreshTokenCookie, oldCookie, 'New refresh token must differ from rotated one');

    // Verify alias /refresh also works with rotated token
    const aliasRes = await fetch(`${BASE_URL}/refresh`, {
      method: 'POST',
      headers: {
        Cookie: refreshTokenCookie,
      },
    });
    const aliasData = await aliasRes.json();
    assert.equal(aliasRes.status, 200, 'Alias /refresh expected 200');
    assert.ok(aliasData.accessToken);
    accessToken = aliasData.accessToken;
    const aliasCookie = aliasRes.headers.get('set-cookie');
    if (aliasCookie) {
      refreshTokenCookie = aliasCookie.split(';')[0];
    }
  });

  test('4c. Replay / Revoked Token Reuse Detection: invalid or consumed refresh token rejected', async () => {
    const res = await fetch(`${BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        Cookie: 'refreshToken=invalid_or_revoked_token',
      },
    });

    assert.equal(res.status, 401, 'Reused or invalid token must be rejected with 401');
    const data = await res.json();
    assert.equal(data.code, 'SESSION_EXPIRED');
  });

  test('4d. Unauthenticated Refresh Request Fails (401)', async () => {
    const res = await fetch(`${BASE_URL}/refresh-token`, {
      method: 'POST',
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.code, 'NO_REFRESH_TOKEN');
  });

  test('5. Forgot Password Request: POST /api/auth/forgot-password', async () => {
    capturedOtp = '';
    const res = await fetch(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email }),
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.ok(capturedOtp.length === 6, 'Must generate reset OTP');
  });

  test('6. Reset Password: POST /api/auth/reset-password', async () => {
    const res = await fetch(`${BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        otp: capturedOtp,
        newPassword,
        confirmNewPassword: newPassword,
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Expected status 200, got ${res.status}: ${JSON.stringify(data)}`);
  });

  test('7. Login with Old Password Fails: POST /api/auth/login', async () => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password, // Old password
      }),
    });

    assert.equal(res.status, 401, 'Old password must be rejected');
  });

  test('8. Login with New Password Succeeds: POST /api/auth/login', async () => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: newPassword, // New password
      }),
    });

    const data = await res.json();
    assert.equal(res.status, 200, 'New password must succeed');
    assert.ok(data.accessToken);
  });

  test('9. User Logout: POST /api/auth/logout', async () => {
    const res = await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        Cookie: refreshTokenCookie,
      },
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.message, 'Logged out successfully.');
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });
});
