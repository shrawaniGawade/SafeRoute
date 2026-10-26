import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server';
import http from 'http';
import { User } from '../models/User';
import { connectDB } from '../config/db';
import { seedDefaultAdmin } from '../config/seedAdmin';

let server: http.Server;
let baseUrl: string;

let userToken: string;
let userId: string;
const userEmail = `tester.api.${Date.now()}@saferoute.test`;
const userPassword = 'Password@Valid123!';

let secondUserToken: string;
const secondUserEmail = `second.user.${Date.now()}@saferoute.test`;

let adminToken: string;
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@saferoute.com').split(',')[0].toLowerCase().trim();
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

let createdPredictionId: string;

describe('SafeRoute Backend API Endpoints Test Suite', () => {
  before(async () => {
    await connectDB();
    await seedDefaultAdmin();

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Login as Admin to get adminToken
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminData = await adminLoginRes.json();
    adminToken = adminData.accessToken;

    // Create and verify standard test user
    await User.create({
      name: 'Alex Commuter',
      email: userEmail,
      password: userPassword,
      role: 'user',
      isVerified: true,
    });

    // Login as standard test user
    const userLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    const userData = await userLoginRes.json();
    userToken = userData.accessToken;
    userId = userData.user.id;

    // Create second standard user for resource ownership check
    await User.create({
      name: 'Samantha Traveler',
      email: secondUserEmail,
      password: userPassword,
      role: 'user',
      isVerified: true,
    });

    const secondLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: secondUserEmail, password: userPassword }),
    });
    const secondUserData = await secondLoginRes.json();
    secondUserToken = secondUserData.accessToken;
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // --------------------------------------------------------------------------
  // 1. Health Endpoints
  // --------------------------------------------------------------------------
  describe('1. Health Check Area', () => {
    test('GET /health returns 200 with structured status and services info', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'ok');
      assert.ok(body.services?.backend, 'Should contain backend status');
      assert.ok(body.services?.database, 'Should contain database status');
      assert.ok(body.services?.aiEngine, 'Should contain AI engine status');
    });

    test('GET /api/health returns 200 and matches system contract', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'ok');
    });

    test('GET /api/health/db returns database health report', async () => {
      const res = await fetch(`${baseUrl}/api/health/db`);
      assert.ok([200, 503].includes(res.status));
      const body = await res.json();
      assert.ok(body.status !== undefined);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Authentication Endpoints
  // --------------------------------------------------------------------------
  describe('2. Authentication Area', () => {
    const newRegEmail = `reg.${Date.now()}@saferoute.test`;

    test('POST /api/auth/register validates and registers account', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Taylor Swift',
          email: newRegEmail,
          password: 'Password@Secure99!',
          confirmPassword: 'Password@Secure99!',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.ok(body.message, 'Must return success message');
      assert.strictEqual(body.email, newRegEmail);
      assert.strictEqual(body.user.email, newRegEmail);
      assert.strictEqual(body.user.isVerified, true);
      assert.ok(body.accessToken, 'Registration must issue an access token');
    });

    test('POST /api/auth/register rejects duplicate registration with 409 Conflict', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Registrant',
          email: userEmail,
          password: 'Password@Secure99!',
          confirmPassword: 'Password@Secure99!',
        }),
      });

      assert.strictEqual(res.status, 409);
      const body = await res.json();
      assert.ok(body.message.includes('already exists'));
    });

    test('POST /api/auth/register ignores client-supplied role (untrusted role rejection)', async () => {
      const clientRoleEmail = `role_test_${Date.now()}@saferoute.test`;
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hacker Wants Admin',
          email: clientRoleEmail,
          password: 'Password@Secure99!',
          confirmPassword: 'Password@Secure99!',
          role: 'admin',
        }),
      });

      assert.strictEqual(res.status, 201);
      const createdUser = await User.findOne({ email: clientRoleEmail });
      assert.ok(createdUser);
      assert.strictEqual(createdUser.role, 'user', 'Client must NOT be able to self-assign admin role');
    });

    test('POST /api/auth/send-otp rejects EMAIL_VERIFICATION because sign-up no longer uses OTP', async () => {
      const otpTestEmail = `otp.test.${Date.now()}@saferoute.test`;
      const res = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpTestEmail, purpose: 'EMAIL_VERIFICATION' }),
      });

      assert.strictEqual(res.status, 410);
      const data = await res.json();
      assert.strictEqual(data.code, 'EMAIL_VERIFICATION_DISABLED');
      assert.ok(data.message.toLowerCase().includes('disabled'));
    });

    test('POST /api/auth/login succeeds for valid credentials', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.ok(body.accessToken, 'Must return JWT accessToken');
      assert.strictEqual(body.user.email, userEmail);
    });

    test('POST /api/auth/login rejects invalid password with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password: 'WrongPassword@999!',
        }),
      });

      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.message, 'Invalid email or password.');
    });

    test('Protected route rejects request with missing token (401)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.ok(body.message.includes('No token provided'));
    });

    test('Protected route rejects request with invalid / forged token (401)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: 'Bearer forged.tampered.signature' },
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.code, 'TOKEN_EXPIRED');
    });

    test('GET /api/auth/me returns current user profile', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.user.email, userEmail);
      assert.strictEqual(body.user.password, undefined);
    });

    test('POST /api/auth/logout successfully terminates session', async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.ok(body.message);
    });

    test('Session refresh fails after logout with 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
      });
      assert.strictEqual(res.status, 401);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Safety Prediction Endpoints
  // --------------------------------------------------------------------------
  describe('3. Safety Prediction Area', () => {
    test('POST /api/safety/predict validates factors and returns safety score', async () => {
      const res = await fetch(`${baseUrl}/api/safety/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          lighting: 9,
          crime_risk: 1,
          accident_risk: 2,
          crowd_level: 8,
          origin: 'North Station, Boston, MA',
          destination: 'Boston Public Library, MA',
          departureTime: '22:00',
          travelMode: 'walking',
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.predictionId, 'Must return a predictionId');
      assert.ok(body.data.safety_score >= 0 && body.data.safety_score <= 100);
      assert.ok(body.data.rating);
      assert.strictEqual(Array.isArray(body.data.alternatives), true);
      assert.strictEqual(body.data.alternatives.length, 3);
      assert.strictEqual(body.data.alternatives[0].letter, 'A');
      assert.strictEqual(body.data.alternatives[1].letter, 'B');
      assert.strictEqual(body.data.alternatives[2].letter, 'C');
      createdPredictionId = body.data.predictionId;
    });

    test('POST /api/safety/predict rejects invalid factor values (e.g. lighting > 10)', async () => {
      const res = await fetch(`${baseUrl}/api/safety/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lighting: 20, // Invalid
          crime_risk: 1,
          accident_risk: 2,
          crowd_level: 8,
        }),
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.message, 'Validation failed');
      assert.ok(body.errors?.lighting);
    });

    test('POST /api/safety/score computes 88.9 score and Low risk for acceptance criteria factors', async () => {
      const res = await fetch(`${baseUrl}/api/safety/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factors: {
            lighting: 90,
            crime: 88,
            accident: 92,
            activity: 80,
            timeOfDay: 95,
            emergencyNearby: 85,
          },
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.score, 88.9);
      assert.strictEqual(body.data.riskLevel, 'Low');
      assert.strictEqual(body.data.weightsTotal, 100);
    });

    test('POST /api/safety/score returns Insufficient data when coverage threshold fails', async () => {
      const res = await fetch(`${baseUrl}/api/safety/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factors: {
            lighting: 90,
            crime: 85,
          },
          coverageThreshold: 0.6,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      // Only 2 of 6 factors known = 33.3% coverage < 60%
      assert.strictEqual(body.data.status, 'Insufficient data');
      assert.strictEqual(body.data.riskLevel, 'Insufficient data');
      assert.strictEqual(body.data.hasSufficientData, false);
      assert.strictEqual(body.data.score, null);
    });

    test('GET /api/safety/history returns paginated prediction history for caller', async () => {
      const res = await fetch(`${baseUrl}/api/safety/history?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.pagination);
      assert.strictEqual(body.pagination.page, 1);
      assert.strictEqual(body.pagination.limit, 5);
    });

    test('GET /api/safety/history/:id returns specific prediction details', async () => {
      assert.ok(createdPredictionId, 'Prediction ID must exist from previous test');
      const res = await fetch(`${baseUrl}/api/safety/history/${createdPredictionId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.id, createdPredictionId);
      assert.strictEqual(body.data.origin, 'North Station, Boston, MA');
    });

    test('GET /api/safety/history/:id enforces ownership restriction (rejects non-owner 403)', async () => {
      assert.ok(createdPredictionId, 'Prediction ID must exist');
      // Second user attempts to access first user's prediction
      const res = await fetch(`${baseUrl}/api/safety/history/${createdPredictionId}`, {
        headers: { Authorization: `Bearer ${secondUserToken}` },
      });

      assert.strictEqual(res.status, 403, 'Should reject access with 403 Forbidden');
      const body = await res.json();
      assert.strictEqual(body.code, 'FORBIDDEN');
    });
  });

  // --------------------------------------------------------------------------
  // 4. User Profile Endpoints
  // --------------------------------------------------------------------------
  describe('4. User Profile Area', () => {
    test('GET /api/users/me returns full profile of authenticated user', async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.email, userEmail);
      assert.strictEqual(body.data.password, undefined);
    });

    test('PATCH /api/users/me updates permitted fields (name, emergencyContact, defaultPreset)', async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          name: 'Alexander Commuter Updated',
          emergencyContact: '+1 (555) 987-6543',
          defaultPreset: 'maximum',
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.name, 'Alexander Commuter Updated');
      assert.strictEqual(body.data.emergencyContact, '+1 (555) 987-6543');
      assert.strictEqual(body.data.defaultPreset, 'maximum');
    });

    test('PATCH /api/users/me rejects password change if current password is wrong', async () => {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'WrongCurrentPassword!',
          newPassword: 'NewPassword@999!',
          confirmPassword: 'NewPassword@999!',
        }),
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Administration Endpoints
  // --------------------------------------------------------------------------
  describe('5. Administration Area', () => {
    test('GET /api/admin/stats returns database, AI, and user telemetry', async () => {
      const res = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.stats.totalUsers >= 1);
      assert.ok(body.data.services.database);
      assert.ok(body.data.services.backend);
    });

    test('GET /api/admin/users returns paginated user directory', async () => {
      const res = await fetch(`${baseUrl}/api/admin/users?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.pagination);
      assert.ok(body.pagination.totalRecords >= 1);
    });

    test('Regular user access to /api/admin/stats is forbidden (403)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    test('Regular user access to /api/admin/users is forbidden (403)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/users?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      assert.strictEqual(res.status, 403);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Centralized Error Handling & Not Found
  // --------------------------------------------------------------------------
  describe('6. Centralized Error Handling', () => {
    test('Non-existent route returns clean 404 with NOT_FOUND code', async () => {
      const res = await fetch(`${baseUrl}/api/non-existent-route-segment`);
      assert.strictEqual(res.status, 404);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.code, 'NOT_FOUND');
    });

    test('Unauthenticated request to protected endpoint returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/users/me`);
      assert.strictEqual(res.status, 401);
    });
  });
});
