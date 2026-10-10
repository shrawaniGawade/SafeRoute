import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../server';
import { seedDefaultAdmin } from '../config/seedAdmin';

let server: http.Server;
const TEST_PORT = 5002;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

test('SafeRoute Admin Endpoints & Authorization', async (t) => {
  await t.test('Start test server & seed admin', async () => {
    await seedDefaultAdmin();
    await new Promise<void>((resolve) => {
      server = app.listen(TEST_PORT, () => resolve());
    });
  });

  let adminToken = '';
  let normalUserToken = '';
  let createdUserId = '';

  await t.test('1. Admin Login & Token Issuance', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@saferoute.com',
        password: 'Admin@12345',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.accessToken);
    assert.strictEqual(data.user.role, 'admin');
    adminToken = data.accessToken;
  });

  await t.test('2. Unauthenticated Access to Admin Stats Fails (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`);
    assert.strictEqual(res.status, 401);
  });

  await t.test('3. Register and Login a Standard User', async () => {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Standard Traveler',
        email: 'traveler.standard@saferoute.test',
        password: 'Password@12345',
        confirmPassword: 'Password@12345',
      }),
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    const otp = regData.devOtp;

    // Verify OTP
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'traveler.standard@saferoute.test',
        otp,
        purpose: 'EMAIL_VERIFICATION',
      }),
    });
    assert.strictEqual(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    normalUserToken = verifyData.accessToken;
    createdUserId = verifyData.user.id;
  });

  await t.test('4. Standard User Access to Admin Stats Forbidden (403)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  await t.test('5. Admin Successfully Retrieves System Telemetry & Stats', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.stats.totalUsers >= 2);
    assert.ok(data.data.services.backend.status === 'ONLINE');
    assert.ok(Array.isArray(data.data.users));
  });

  await t.test('6. Admin Promotes Standard User to Admin Role', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'admin' }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.role, 'admin');
  });

  await t.test('7. Admin Demotes User Back to Regular User', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'user' }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.role, 'user');
  });

  await t.test('8. Admin Deletes Standard User', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
  });

  await t.test('Teardown test server', async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
