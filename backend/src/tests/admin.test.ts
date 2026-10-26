import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../server';
import { connectDB } from '../config/db';
import { seedDefaultAdmin } from '../config/seedAdmin';
import { ENV } from '../config/env';

let server: http.Server;
let BASE_URL = '';

const adminEmail = (process.env.ADMIN_EMAIL || 'admin@saferoute.com').split(',')[0].toLowerCase().trim();
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

  await t.test('3. Register a Standard User and receive a session', async () => {
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

    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, `Register failed: ${regRes.status} ${JSON.stringify(regData)}`);
    assert.strictEqual(regData.user.isVerified, true);
    normalUserToken = regData.accessToken;
    createdUserId = regData.user.id;
  });

  await t.test('4. Standard User Access to Admin Stats Forbidden (403)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  await t.test('4b. Standard User Cannot Modify Roles or Delete Users (403)', async () => {
    const patchRes = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${normalUserToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'admin' }),
    });
    assert.strictEqual(patchRes.status, 403, 'Normal user cannot modify roles');

    const deleteRes = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    assert.strictEqual(deleteRes.status, 403, 'Normal user cannot delete users');
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

  await t.test('6. Admin Cannot Promote Standard User to Admin Role (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'admin' }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 403, `Promote must be forbidden: ${res.status} ${JSON.stringify(data)}`);
    assert.strictEqual(data.success, false);

    // Verify user role remained 'user'
    const userRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const userData = await userRes.json();
    const targetUser = userData.data.find((u: any) => u.id === createdUserId);
    assert.strictEqual(targetUser.role, 'user', 'Target user role must remain "user"');
  });

  await t.test('7. Admin Cannot Modify Any User Role (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'user' }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 403, `Role change must be forbidden: ${res.status} ${JSON.stringify(data)}`);
    assert.strictEqual(data.success, false);
  });

  await t.test('7b. Admin Cannot Demote or Delete Primary Admin Account (400/403)', async () => {
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meData = await meRes.json();
    const adminSelfId = meData.user.id;

    const selfDemoteRes = await fetch(`${BASE_URL}/api/admin/users/${adminSelfId}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'user' }),
    });
    assert.strictEqual(selfDemoteRes.status, 403, 'Admin must not be allowed to change roles');

    const selfDeleteRes = await fetch(`${BASE_URL}/api/admin/users/${adminSelfId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(selfDeleteRes.status, 400, 'Primary admin must not be allowed to be deleted');
  });

  await t.test('8. Admin Deletes Standard User', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
  });

  await t.test('9. Expired or Invalid JWT Tokens are Rejected with HTTP 401', async () => {
    // Malformed token
    const malformedRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: 'Bearer this.is.not.a.valid.jwt.token' },
    });
    assert.strictEqual(malformedRes.status, 401, 'Malformed token must return 401');

    // Expired token
    const expiredToken = jwt.sign(
      { userId: 'test_expired_id', role: 'admin' },
      ENV.JWT.ACCESS_SECRET,
      { expiresIn: '-1s' }
    );
    const expiredRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.strictEqual(expiredRes.status, 401, 'Expired token must return 401');
    const expiredBody = await expiredRes.json();
    assert.strictEqual(expiredBody.code, 'TOKEN_EXPIRED');

    // Token signed with wrong secret
    const forgedToken = jwt.sign(
      { userId: 'test_hacker_id', role: 'admin' },
      'completely_wrong_untrusted_secret_key_123',
      { expiresIn: '15m' }
    );
    const forgedRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert.strictEqual(forgedRes.status, 401, 'Forged signature token must return 401');
  });

  await t.test('10. Token with Missing or Invalid Role is Rejected with HTTP 403', async () => {
    // Token with arbitrary non-admin role
    const guestToken = jwt.sign(
      { userId: 'test_guest_id', role: 'guest' },
      ENV.JWT.ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    const guestRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    assert.strictEqual(guestRes.status, 403, 'Guest role must return 403 on admin routes');

    // Token with empty role
    const noRoleToken = jwt.sign(
      { userId: 'test_norole_id', role: '' },
      ENV.JWT.ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    const noRoleRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${noRoleToken}` },
    });
    assert.strictEqual(noRoleRes.status, 403, 'Missing role must return 403 on admin routes');
  });

  await t.test('11. Any Authenticated Admin Role Token can Access Admin Telemetry', async () => {
    // An authorized admin with a custom email (e.g. shrawanig74@gmail.com)
    const customAdminToken = jwt.sign(
      { userId: 'shrawani_admin_id', role: 'admin' },
      ENV.JWT.ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    const customAdminRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${customAdminToken}` },
    });
    assert.strictEqual(customAdminRes.status, 200, 'Custom admin token must succeed');
    const customAdminBody = await customAdminRes.json();
    assert.strictEqual(customAdminBody.success, true);
    assert.ok(customAdminBody.data.services.backend.status === 'ONLINE');
  });
});
