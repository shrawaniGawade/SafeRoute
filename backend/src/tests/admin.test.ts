import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../server';
import { connectDB } from '../config/db';
import { seedDefaultAdmin } from '../config/seedAdmin';

let server: http.Server;
let BASE_URL = '';

const adminEmail = (process.env.ADMIN_EMAIL || 'admin@saferoute.com').toLowerCase().trim();
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

test('SafeRoute Admin Endpoints & Authorization', async (t) => {
  // Guaranteed cleanup: ensure HTTP server closes even if any subtest fails
  t.after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  await t.test('Start test server & seed admin', async () => {
    await connectDB();
    await seedDefaultAdmin();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        BASE_URL = `http://127.0.0.1:${address.port}`;
        resolve();
      });
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
        email: adminEmail,
        password: adminPassword,
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Admin login failed: ${res.status} ${JSON.stringify(data)}`);
    assert.ok(data.accessToken, 'Access token must be returned');
    assert.strictEqual(data.user?.role, 'admin', 'User role must be admin');
    adminToken = data.accessToken;
  });

  await t.test('2. Unauthenticated Access to Admin Stats Fails (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`);
    assert.strictEqual(res.status, 401);
  });

  await t.test('3. Register and Login a Standard User', async () => {
    let capturedOtp = '';
    const origLog = console.log;
    console.log = (...args: any[]) => {
      const line = args.join(' ');
      const match = line.match(/Code:\s*>>>\s*(\d{6})\s*<<</);
      if (match) {
        capturedOtp = match[1];
      }
      origLog(...args);
    };

    const userEmail = `traveler.admin.${Date.now()}.${Math.random().toString(36).substring(2, 7)}@saferoute.test`;

    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Standard Traveler',
        email: userEmail,
        password: 'Password@12345',
        confirmPassword: 'Password@12345',
      }),
    });
    console.log = origLog;

    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, `Register failed: ${regRes.status} ${JSON.stringify(regData)}`);
    const otp = capturedOtp;

    // Verify OTP
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        otp,
        purpose: 'EMAIL_VERIFICATION',
      }),
    });
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyRes.status, 200, `Verify OTP failed: ${verifyRes.status} ${JSON.stringify(verifyData)}`);
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
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Admin stats failed: ${res.status} ${JSON.stringify(data)}`);
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
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Promote failed: ${res.status} ${JSON.stringify(data)}`);
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
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Demote failed: ${res.status} ${JSON.stringify(data)}`);
    assert.strictEqual(data.user.role, 'user');
  });

  await t.test('8. Admin Deletes Standard User', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
  });
});
