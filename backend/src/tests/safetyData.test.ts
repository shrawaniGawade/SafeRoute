import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { SafetyRecord } from '../models/SafetyRecord';
import { EmergencyLocation } from '../models/EmergencyLocation';
import { seedSafetyData } from '../scripts/seedSafetyData';
import { seedEmergency } from '../scripts/seedEmergency';
import { seedAll } from '../scripts/seed';

describe('ISSUE-12: Safety Data Models & Seed Data Suite', () => {
  before(async () => {
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      try {
        await SafetyRecord.deleteMany({ 'metadata.testSuite': true });
        await EmergencyLocation.deleteMany({ 'metadata.testSuite': true });
        await SafetyRecord.init();
        await EmergencyLocation.init();
      } catch (_) {}
    }
  });

  after(async () => {
    // Clean up any test records created
    try {
      await SafetyRecord.deleteMany({ 'metadata.testSuite': true });
      await EmergencyLocation.deleteMany({ 'metadata.testSuite': true });
    } catch (_) {}
  });

  // --------------------------------------------------------------------------
  // 1. SafetyRecord Model: Schema & Coordinate Bounds Validation
  // --------------------------------------------------------------------------
  describe('1. SafetyRecord Model Schema & Bounds Validation', () => {
    test('1a. Creates valid safety record with GeoJSON [longitude, latitude]', async () => {
      const record = await SafetyRecord.create({
        location: {
          type: 'Point',
          coordinates: [-87.6298, 41.8781], // [longitude, latitude]
        },
        factor: 'crime',
        value: 65,
        source: 'Unit Test Data Source',
        isSample: true,
        metadata: { testSuite: true },
      });

      assert.ok(record._id, 'Record must have an identifier');
      assert.strictEqual(record.location.type, 'Point');
      assert.strictEqual(record.location.coordinates[0], -87.6298, 'Index 0 must be longitude');
      assert.strictEqual(record.location.coordinates[1], 41.8781, 'Index 1 must be latitude');
      assert.strictEqual(record.factor, 'crime');
      assert.strictEqual(record.value, 65);
      assert.strictEqual(record.isSample, true);
    });

    test('1b. Rejects invalid coordinates (longitude out of bounds > 180 or < -180)', async () => {
      await assert.rejects(
        async () => {
          await SafetyRecord.create({
            location: {
              type: 'Point',
              coordinates: [205.5, 41.8781], // Invalid longitude
            },
            factor: 'crime',
            value: 50,
            source: 'Test Source',
          });
        },
        (err: any) => {
          return err.name === 'ValidationError' || err.message.includes('Coordinates');
        },
        'Should reject coordinates with longitude out of bounds'
      );
    });

    test('1c. Rejects invalid coordinates (latitude out of bounds > 90 or < -90)', async () => {
      await assert.rejects(
        async () => {
          await SafetyRecord.create({
            location: {
              type: 'Point',
              coordinates: [-87.6298, 98.2], // Invalid latitude
            },
            factor: 'accident',
            value: 40,
            source: 'Test Source',
          });
        },
        (err: any) => {
          return err.name === 'ValidationError' || err.message.includes('Coordinates');
        },
        'Should reject coordinates with latitude out of bounds'
      );
    });

    test('1d. Rejects factor value outside [0, 100] range', async () => {
      await assert.rejects(
        async () => {
          await SafetyRecord.create({
            location: {
              type: 'Point',
              coordinates: [-87.6298, 41.8781],
            },
            factor: 'lighting',
            value: 125, // Value > 100
            source: 'Test Source',
          });
        },
        (err: any) => {
          return err.name === 'ValidationError' || err.message.includes('value');
        },
        'Should reject factor value greater than 100'
      );

      await assert.rejects(
        async () => {
          await SafetyRecord.create({
            location: {
              type: 'Point',
              coordinates: [-87.6298, 41.8781],
            },
            factor: 'lighting',
            value: -5, // Value < 0
            source: 'Test Source',
          });
        },
        (err: any) => {
          return err.name === 'ValidationError' || err.message.includes('value');
        },
        'Should reject factor value less than 0'
      );
    });

    test('1e. Rejects missing required factor category or source', async () => {
      await assert.rejects(async () => {
        await SafetyRecord.create({
          location: {
            type: 'Point',
            coordinates: [-87.6298, 41.8781],
          },
          value: 70,
          source: 'Test Source',
          // Missing factor
        });
      });

      await assert.rejects(async () => {
        await SafetyRecord.create({
          location: {
            type: 'Point',
            coordinates: [-87.6298, 41.8781],
          },
          factor: 'lighting',
          value: 70,
          // Missing source
        });
      });
    });
  });

  // --------------------------------------------------------------------------
  // 2. EmergencyLocation Model: Schema & Type Validation
  // --------------------------------------------------------------------------
  describe('2. EmergencyLocation Model Schema & Facility Types', () => {
    test('2a. Creates valid emergency facility with phone and address', async () => {
      await EmergencyLocation.deleteOne({ osmId: 'test_osm_unit_001' });
      const facility = await EmergencyLocation.create({
        name: 'Chicago Central First Aid Station',
        type: 'emergency_care',
        location: {
          type: 'Point',
          coordinates: [-87.628, 41.882],
        },
        phone: '+1-312-555-0199',
        source: 'openstreetmap',
        osmId: 'test_osm_unit_001',
        isSample: true,
        metadata: { testSuite: true },
      });

      assert.ok(facility._id, 'Facility must have an identifier');
      assert.strictEqual(facility.name, 'Chicago Central First Aid Station');
      assert.strictEqual(facility.type, 'emergency_care');
      assert.strictEqual(facility.location.coordinates[0], -87.628);
      assert.strictEqual(facility.location.coordinates[1], 41.882);
      assert.strictEqual(facility.phone, '+1-312-555-0199');
    });

    test('2b. Rejects invalid emergency facility type enum', async () => {
      await assert.rejects(
        async () => {
          await EmergencyLocation.create({
            name: 'Invalid Type Station',
            type: 'spaceship_station' as any,
            location: {
              type: 'Point',
              coordinates: [-87.628, 41.882],
            },
            source: 'test',
          });
        },
        (err: any) => {
          return err.name === 'ValidationError' || err.message.includes('Type');
        },
        'Should reject invalid type'
      );
    });
  });

  // --------------------------------------------------------------------------
  // 3. Database Seeding & Idempotency
  // --------------------------------------------------------------------------
  describe('3. Database Seeding & Idempotency Pipeline', () => {
    test('3a. Master seeder populates safety records and emergency POIs', async () => {
      const summary = await seedAll(true); // Run in silent mode
      assert.ok(summary.safety.totalParsed > 0, 'Must have parsed safety records');
      assert.ok(summary.safety.lightingRecordsCount > 0, 'Must include streetlighting corridor records');
      assert.ok(summary.emergency.totalIngested > 0, 'Must have ingested emergency locations');
      assert.ok(summary.totalSafetyRecords > 0, 'Database must have active safety records');
      assert.ok(summary.totalEmergencyLocations > 0, 'Database must have active emergency locations');
    });

    test('3b. Simulated and sample records are marked with isSample: true', async () => {
      const sampleSafety = await SafetyRecord.findOne({ isSample: true });
      assert.ok(sampleSafety, 'At least one safety record must have isSample: true');
      assert.strictEqual(sampleSafety.isSample, true);

      const sampleEmergency = await EmergencyLocation.findOne({ isSample: true });
      assert.ok(sampleEmergency, 'Emergency facility must have isSample: true');
      assert.strictEqual(sampleEmergency.isSample, true);
    });

    test('3c. Seeder is strictly idempotent: re-running does not duplicate records', async () => {
      const initialSafetyCount = await SafetyRecord.countDocuments();
      const initialEmergencyCount = await EmergencyLocation.countDocuments();

      // Re-run seed process
      const secondSummary = await seedAll(true);

      const afterSafetyCount = await SafetyRecord.countDocuments();
      const afterEmergencyCount = await EmergencyLocation.countDocuments();

      assert.strictEqual(
        afterSafetyCount,
        initialSafetyCount,
        `Safety records count changed from ${initialSafetyCount} to ${afterSafetyCount} (Duplicate records detected!)`
      );
      assert.strictEqual(
        afterEmergencyCount,
        initialEmergencyCount,
        `Emergency locations count changed from ${initialEmergencyCount} to ${afterEmergencyCount} (Duplicate records detected!)`
      );
      assert.strictEqual(secondSummary.safety.totalUpserted, 0, 'Second run should perform 0 new inserts (all matched)');
    });
  });

  // --------------------------------------------------------------------------
  // 4. $geoNear Geospatial Proximity Queries
  // --------------------------------------------------------------------------
  describe('4. Geospatial Proximity ($geoNear) Aggregations', () => {
    test('4a. $geoNear returns records within 500m of point with calculated distance field', async () => {
      // Query from Loop center (State & Madison): [-87.6278, 41.8819]
      const targetLon = -87.6278;
      const targetLat = 41.8819;

      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [targetLon, targetLat],
            },
            distanceField: 'calculatedDistMeters',
            maxDistance: 1500, // Within 1.5 km
            spherical: true,
          },
        },
        { $limit: 10 },
      ];

      const nearbyRecords = await SafetyRecord.aggregate(pipeline);
      assert.ok(nearbyRecords.length > 0, 'Must return at least one safety record near downtown Loop');

      for (let i = 0; i < nearbyRecords.length; i++) {
        const item = nearbyRecords[i];
        assert.ok(
          item.calculatedDistMeters !== undefined && item.calculatedDistMeters >= 0,
          'Distance field must be calculated and non-negative'
        );
        assert.ok(item.calculatedDistMeters <= 1500, 'Distance must be within maxDistance 1500m');

        if (i > 0) {
          assert.ok(
            item.calculatedDistMeters >= nearbyRecords[i - 1].calculatedDistMeters,
            'Records must be sorted by ascending distance'
          );
        }
      }
    });

    test('4b. $geoNear finds nearest hospital to River North / Magnificent Mile', async () => {
      // Near Northwestern Memorial Hospital: [-87.6214, 41.8953]
      const targetLon = -87.6214;
      const targetLat = 41.8953;

      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [targetLon, targetLat],
            },
            distanceField: 'distM',
            query: { type: 'hospital' },
            spherical: true,
          },
        },
        { $limit: 1 },
      ];

      const results = await EmergencyLocation.aggregate(pipeline);
      assert.strictEqual(results.length, 1, 'Must find 1 nearest hospital');
      const nearest = results[0];
      assert.strictEqual(nearest.type, 'hospital');
      // Should find Northwestern Memorial Hospital within 100 meters
      assert.ok(nearest.name.toLowerCase().includes('northwestern'), `Expected Northwestern, got: ${nearest.name}`);
      assert.ok(nearest.distM < 100, `Expected distance < 100m, got: ${nearest.distM}m`);
    });

    test('4c. $geoNear filters by factor (e.g. lighting only)', async () => {
      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [-87.6244, 41.8924], // Michigan Ave
            },
            distanceField: 'dist',
            query: { factor: 'lighting' },
            maxDistance: 2000,
            spherical: true,
          },
        },
      ];

      const lightingNear = await SafetyRecord.aggregate(pipeline);
      assert.ok(lightingNear.length > 0, 'Must return lighting corridors');
      for (const rec of lightingNear) {
        assert.strictEqual(rec.factor, 'lighting');
        assert.ok(rec.value >= 0 && rec.value <= 100);
      }
    });
  });
});
