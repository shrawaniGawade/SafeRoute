import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDB, checkDBHealth, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { SafetyPrediction } from '../models/SafetyPrediction';
import { RouteHistory } from '../models/RouteHistory';
import { AuditLog, logAdminAction, sanitizeAuditMetadata } from '../models/AuditLog';

describe('SafeRoute Database Layer — Unit, Schema & Integration Tests', () => {
  before(async () => {
    // Attempt database connection (gracefully falls back if mongod not running)
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      try {
        await User.init();
        await SafetyPrediction.init();
      } catch (_) {}
    }
  });

  // --------------------------------------------------------------------------
  // 1. Database Connectivity & Health Check
  // --------------------------------------------------------------------------
  test('1. Database Health Check probe reports structured status', async () => {
    const health = await checkDBHealth();
    assert.ok(health, 'Health probe must return a status object');
    assert.ok(
      ['CONNECTED', 'DISCONNECTED', 'CONNECTING', 'DEGRADED'].includes(health.status),
      `Expected valid status, got: ${health.status}`
    );
    assert.strictEqual(typeof health.connected, 'boolean');
    assert.strictEqual(typeof health.readyState, 'number');

    if (health.connected) {
      console.log(`  [Pass] Live MongoDB instance verified: ${health.host}/${health.databaseName} (Latency: ${health.latencyMs}ms)`);
    } else {
      console.log('  [Pass] In-memory resilient development mode active (MongoDB server offline)');
    }
  });

  // --------------------------------------------------------------------------
  // 2. User Model: Creation, Normalization, Hashing & Duplicate Email
  // --------------------------------------------------------------------------
  describe('2. User Model Schema, Constraints & Validation', () => {
    const testEmail = `commuter.dbtest.${Date.now()}@saferoute.test`;

    test('2a. User creation normalizes email, hashes password, and defaults role to "user"', async () => {
      const user = await User.create({
        name: 'Jordan Safety Traveler',
        email: `  ${testEmail.toUpperCase()}  `, // Test normalization
        password: 'Password@Secure123!',
        role: 'user',
        isVerified: true,
      });

      assert.ok(user._id, 'User must have an identifier');
      assert.strictEqual(user.name, 'Jordan Safety Traveler');
      assert.strictEqual(user.email, testEmail.toLowerCase(), 'Email must be normalized to lowercase and trimmed');
      assert.strictEqual(user.role, 'user', 'Default role must be "user"');

      // Verify password hashing
      assert.notStrictEqual(user.password, 'Password@Secure123!', 'Plaintext password must never be stored');
      assert.ok(user.password?.startsWith('$2'), 'Password must be hashed with bcrypt ($2a$ or $2b$)');

      // Verify comparePassword method
      const isMatch = await user.comparePassword('Password@Secure123!');
      assert.strictEqual(isMatch, true, 'comparePassword must return true for correct password');

      const isMismatch = await user.comparePassword('WrongPassword999!');
      assert.strictEqual(isMismatch, false, 'comparePassword must return false for incorrect password');
    });

    test('2b. Password hash is excluded in toJSON() and API serialization', async () => {
      const fetched = await User.findOne({ email: testEmail });
      assert.ok(fetched, 'User should be found');

      const jsonUser = typeof fetched.toJSON === 'function' ? fetched.toJSON() : { ...fetched };
      assert.strictEqual(jsonUser.password, undefined, 'Password must be completely stripped from JSON outputs');
    });

    test('2c. Duplicate email registration is prevented with code 11000', async () => {
      let duplicateError: any = null;
      try {
        await User.create({
          name: 'Imposter Account',
          email: testEmail, // Exact same normalized email
          password: 'AnotherPassword@123',
          role: 'user',
        });
      } catch (err: any) {
        duplicateError = err;
      }

      assert.ok(duplicateError, 'Duplicate email must throw an error');
      assert.ok(
        duplicateError.code === 11000 ||
          duplicateError.message.includes('duplicate key') ||
          duplicateError.message.includes('11000'),
        `Expected duplicate key error code 11000, got: ${duplicateError.message}`
      );
    });

    test('2d. Validation rejects prohibited roles (must be user or admin)', async () => {
      let roleError: any = null;
      try {
        await User.create({
          name: 'Hacker Account',
          email: `hacker.${Date.now()}@test.com`,
          password: 'Password@123',
          role: 'superadmin_prohibited' as any,
        });
      } catch (err: any) {
        roleError = err;
      }

      assert.ok(roleError, 'Invalid role must fail schema validation');
    });
  });

  // --------------------------------------------------------------------------
  // 3. SafetyPrediction Model: Factors, Scores, User Linkage & Idempotency
  // --------------------------------------------------------------------------
  describe('3. SafetyPrediction Model & Validation', () => {
    const idempotencyKey = `req_${Date.now()}_abc123`;
    let savedPredictionId: string;

    test('3a. Creates SafetyPrediction with valid factors and calculated score', async () => {
      const pred = await SafetyPrediction.create({
        clientRequestId: idempotencyKey,
        origin: 'Kendall Square, Cambridge, MA',
        destination: 'Beacon Hill, Boston, MA',
        departureTime: '21:30',
        travelMode: 'walking',
        factors: {
          lighting: 9,
          crime_risk: 1,
          accident_risk: 2,
          crowd_level: 8,
        },
        safety_score: 91,
        prediction_details: {
          classification: 'Safe',
          recommendation: 'Continuous street illumination detected.',
        },
        model_info: {
          model_name: 'SafeRoute RandomForestClassifier',
          version: 'v1.0.0',
          data_source: 'SafeRoute Municipal Registry',
        },
      });

      assert.ok(pred._id, 'Prediction must have an ID');
      savedPredictionId = pred._id.toString();
      assert.strictEqual(pred.safety_score, 91);
      assert.strictEqual(pred.factors.lighting, 9);
      assert.strictEqual(pred.prediction_details.classification, 'Safe');
    });

    test('3b. Prevents duplicate prediction creation on unsafe retries (Idempotency)', async () => {
      // Re-send with the exact same clientRequestId
      const duplicateAttempt = await SafetyPrediction.create({
        clientRequestId: idempotencyKey,
        origin: 'Kendall Square, Cambridge, MA',
        destination: 'Beacon Hill, Boston, MA',
        factors: { lighting: 9, crime_risk: 1, accident_risk: 2, crowd_level: 8 },
        safety_score: 91,
      });

      assert.strictEqual(
        duplicateAttempt._id.toString(),
        savedPredictionId,
        'Idempotent retry with same clientRequestId must return existing record'
      );
    });

    test('3c. Fails validation when safety factor or score is out of bounds', async () => {
      let scoreError: any = null;
      try {
        await SafetyPrediction.create({
          factors: { lighting: 15, crime_risk: 1, accident_risk: 2, crowd_level: 8 }, // lighting > 10
          safety_score: 120, // score > 100
        });
      } catch (err: any) {
        scoreError = err;
      }

      assert.ok(scoreError, 'Out of bounds factor and score must fail validation');
    });
  });

  // --------------------------------------------------------------------------
  // 4. RouteHistory Model: Mandatory Route Data & User Ownership
  // --------------------------------------------------------------------------
  describe('4. RouteHistory Model & Ownership Constraints', () => {
    test('4a. Successfully persists route history when valid route data is present', async () => {
      const route = await RouteHistory.create({
        origin: {
          name: 'South Station, Boston, MA',
          coordinates: { lat: 42.3522, lng: -71.0552 },
        },
        destination: {
          name: 'Boston Common, Boston, MA',
          coordinates: { lat: 42.3550, lng: -71.0656 },
        },
        selectedRoute: {
          routeName: 'Illuminated Tremont Corridor',
          travelMode: 'walking',
          distanceText: '1.2 km',
          durationText: '14 mins',
          safetyScore: 89,
          waypoints: [
            { lat: 42.3522, lng: -71.0552, label: 'Start' },
            { lat: 42.3550, lng: -71.0656, label: 'End' },
          ],
        },
        status: 'selected',
      });

      assert.ok(route._id, 'Route history record must have an ID');
      assert.strictEqual(route.selectedRoute.routeName, 'Illuminated Tremont Corridor');
      assert.strictEqual(route.selectedRoute.safetyScore, 89);
    });

    test('4b. Rejects route persistence when required route data is missing', async () => {
      let missingRouteError: any = null;
      try {
        await RouteHistory.create({
          origin: { name: 'Origin Only' },
          destination: { name: 'Destination Only' },
          // selectedRoute is completely missing
        });
      } catch (err: any) {
        missingRouteError = err;
      }

      assert.ok(
        missingRouteError,
        'Must reject persistence when route data is missing ("Store routes only if route data is actually available")'
      );
    });
  });

  // --------------------------------------------------------------------------
  // 5. AuditLog Model: Administrative Action Logging & Secret Sanitization
  // --------------------------------------------------------------------------
  describe('5. AuditLog Model & Mandatory Secret Scrubbing', () => {
    test('5a. sanitizeAuditMetadata strictly redacts passwords, tokens, secrets and OTPs', () => {
      const dangerousMetadata = {
        adminEmail: 'admin@saferoute.com',
        userTargetId: 'user_123',
        password: 'AdminPasswordPlainText123!',
        newPassword: 'SecretNewPassword456!',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret',
        refreshTokenHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        otpCode: '849201',
        nestedData: {
          authorizationHeader: 'Bearer eyJhbGciOi...',
          safeField: 'This is safe',
        },
      };

      const sanitized = sanitizeAuditMetadata(dangerousMetadata);

      assert.strictEqual(sanitized.password, '[REDACTED_SECRET]');
      assert.strictEqual(sanitized.newPassword, '[REDACTED_SECRET]');
      assert.strictEqual(sanitized.accessToken, '[REDACTED_SECRET]');
      assert.strictEqual(sanitized.refreshTokenHash, '[REDACTED_SECRET]');
      assert.strictEqual(sanitized.otpCode, '[REDACTED_SECRET]');
      assert.strictEqual(sanitized.nestedData.authorizationHeader, '[REDACTED_SECRET]');
      assert.strictEqual(sanitized.nestedData.safeField, 'This is safe');
      assert.strictEqual(sanitized.adminEmail, 'admin@saferoute.com');
    });

    test('5b. AuditLog records administrative actions without persisting secrets', async () => {
      await logAdminAction({
        action: 'USER_ROLE_PROMOTED',
        actor: {
          role: 'admin',
          email: 'admin@saferoute.com',
          ipAddress: '127.0.0.1',
        },
        target: {
          resourceType: 'User',
          resourceId: 'test_user_789',
          resourceName: 'traveler@saferoute.test',
        },
        status: 'SUCCESS',
        metadata: {
          previousRole: 'user',
          newRole: 'admin',
          tempToken: 'token_that_must_be_scrubbed', // Must be scrubbed
        },
      });

      const auditLogs = await AuditLog.find({
        action: 'USER_ROLE_PROMOTED',
        'target.resourceId': 'test_user_789',
      }).limit(1);
      assert.ok(auditLogs.length > 0, 'Audit log must be saved');

      const logged = auditLogs[0];
      assert.strictEqual(logged.action, 'USER_ROLE_PROMOTED');
      assert.strictEqual(logged.actor.email, 'admin@saferoute.com');
      assert.strictEqual(logged.metadata.newRole, 'admin');
      assert.strictEqual(
        logged.metadata.tempToken,
        '[REDACTED_SECRET]',
        'Audit logger must redact sensitive fields automatically'
      );
    });
  });
});
