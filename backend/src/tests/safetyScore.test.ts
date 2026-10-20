import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { SafetyRecord } from '../models/SafetyRecord';
import { EmergencyLocation } from '../models/EmergencyLocation';
import { seedAll } from '../scripts/seed';
import {
  calculateSafetyScore,
  getTimeFactorScore,
  normalizeWeights,
  determineRiskLevel,
  sampleRoutePoints,
  evaluateRouteSafetyScore,
  DEFAULT_FACTOR_WEIGHTS,
  FactorScoresInput,
} from '../services/safetyScore.service';

describe('ISSUE-13: Safety Score Engine Service & Formula Suite', () => {
  before(async () => {
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      try {
        await SafetyRecord.init();
        await EmergencyLocation.init();
      } catch (_) {}
    }
    // Seed data to ensure geospatial lookups have valid data
    await seedAll(true);
  });

  // --------------------------------------------------------------------------
  // 1. Acceptance Criteria 1: Formula Calculation & Risk Level Low
  // --------------------------------------------------------------------------
  describe('1. Core 6-Factor Formula & Acceptance Criteria', () => {
    test('1a. Acceptance Criteria 1: Given factors (90, 88, 92, 80, 95, 85), score is 88.9 and risk is Low', () => {
      const input: FactorScoresInput = {
        lighting: 90,
        crime: 88,
        accident: 92,
        activity: 80,
        timeOfDay: 95,
        emergencyNearby: 85,
      };

      const result = calculateSafetyScore(input);

      // Formula: 90*0.25 + 88*0.25 + 92*0.20 + 80*0.10 + 95*0.10 + 85*0.10
      // = 22.5 + 22.0 + 18.4 + 8.0 + 9.5 + 8.5 = 88.9
      assert.strictEqual(result.score, 88.9, 'Expected exact score of 88.9');
      assert.strictEqual(result.displayScore, '88.9');
      assert.strictEqual(result.riskLevel, 'Low', 'Score >= 75 must be categorized as Low risk');
      assert.strictEqual(result.hasSufficientData, true);
      assert.strictEqual(result.status, 'sufficient');
      assert.strictEqual(result.weightsTotal, 100);
    });

    test('1b. Clamps input factor scores between 0 and 100', () => {
      const input: FactorScoresInput = {
        lighting: 150, // Out of bounds high
        crime: -20, // Out of bounds low
        accident: 80,
        activity: 80,
        timeOfDay: 80,
        emergencyNearby: 80,
      };

      const result = calculateSafetyScore(input);
      assert.strictEqual(result.factors.lighting.score, 100, 'Lighting should be clamped to 100');
      assert.strictEqual(result.factors.crime.score, 0, 'Crime should be clamped to 0');
      assert.ok(result.score !== null && result.score <= 100 && result.score >= 0);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Acceptance Criteria 2: Data Coverage Thresholds & "Insufficient data"
  // --------------------------------------------------------------------------
  describe('2. Coverage Threshold & Insufficient Data Handling', () => {
    test('2a. Acceptance Criteria 2: Given only 50% data coverage, result is "Insufficient data"', () => {
      const input: FactorScoresInput = {
        lighting: 85,
        crime: 80,
        accident: 75,
        activity: null,
        timeOfDay: 90,
        emergencyNearby: null,
      };

      // Explicitly specify 50% coverage (0.50)
      const result = calculateSafetyScore(input, { coveragePercentage: 0.5 });

      assert.strictEqual(result.hasSufficientData, false, '50% coverage must fail threshold >= 60%');
      assert.strictEqual(result.riskLevel, 'Insufficient data');
      assert.strictEqual(result.status, 'Insufficient data');
      assert.strictEqual(result.score, null, 'Score must be null when coverage is insufficient');
      assert.strictEqual(result.displayScore, 'unknown');
    });

    test('2b. Meets threshold at exactly 60% coverage and above', () => {
      const input: FactorScoresInput = {
        lighting: 90,
        crime: 80,
        accident: 85,
        activity: 70,
        timeOfDay: 80,
        emergencyNearby: 85,
      };

      const atThreshold = calculateSafetyScore(input, { coveragePercentage: 0.6 });
      assert.strictEqual(atThreshold.hasSufficientData, true);
      assert.strictEqual(atThreshold.status, 'sufficient');
      assert.ok(atThreshold.score !== null);

      const aboveThreshold = calculateSafetyScore(input, { coveragePercentage: 0.85 });
      assert.strictEqual(aboveThreshold.hasSufficientData, true);
      assert.strictEqual(aboveThreshold.status, 'sufficient');
      assert.ok(aboveThreshold.score !== null);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Acceptance Criteria 3: Time Factor Rules
  // --------------------------------------------------------------------------
  describe('3. Time Factor Rules (Day 100, Evening 70, Night 40)', () => {
    test('3a. Acceptance Criteria 3: Given night departure, time factor is lower than day departure', () => {
      const dayResult = getTimeFactorScore('day');
      const eveningResult = getTimeFactorScore('evening');
      const nightResult = getTimeFactorScore('night');

      assert.strictEqual(dayResult.score, 100, 'Day score must be 100');
      assert.strictEqual(eveningResult.score, 70, 'Evening score must be 70');
      assert.strictEqual(nightResult.score, 40, 'Night score must be 40');

      assert.ok(
        nightResult.score < dayResult.score,
        'Night departure time factor must be lower than day departure'
      );
      assert.ok(
        nightResult.score < eveningResult.score,
        'Night departure time factor must be lower than evening departure'
      );
    });

    test('3b. Parses 24-hour timestamps accurately into day, evening, and night periods', () => {
      // 14:30 (2:30 PM) -> Day
      const midDay = getTimeFactorScore('14:30');
      assert.strictEqual(midDay.period, 'day');
      assert.strictEqual(midDay.score, 100);

      // 19:45 (7:45 PM) -> Evening
      const evening = getTimeFactorScore('19:45');
      assert.strictEqual(evening.period, 'evening');
      assert.strictEqual(evening.score, 70);

      // 23:15 (11:15 PM) -> Night
      const night = getTimeFactorScore('23:15');
      assert.strictEqual(night.period, 'night');
      assert.strictEqual(night.score, 40);

      // 03:00 (3:00 AM) -> Night
      const earlyMorning = getTimeFactorScore('03:00');
      assert.strictEqual(earlyMorning.period, 'night');
      assert.strictEqual(earlyMorning.score, 40);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Acceptance Criteria 4: Weights Always Total 100%
  // --------------------------------------------------------------------------
  describe('4. Weights Total Integrity & Missing Data Weight Redistribution', () => {
    test('4a. Acceptance Criteria 4: Given standard weights, they always total 100%', () => {
      const weights = DEFAULT_FACTOR_WEIGHTS;
      const total =
        weights.lighting +
        weights.crime +
        weights.accident +
        weights.activity +
        weights.timeOfDay +
        weights.emergencyNearby;

      assert.strictEqual(
        Math.round(total * 100),
        100,
        `Expected weights to total 100%, got: ${total * 100}%`
      );
    });

    test('4b. Missing weights are proportionally redistributed across known factors', () => {
      // Suppose crime (25%) and emergencyNearby (10%) are missing/unknown
      const input: FactorScoresInput = {
        lighting: 80,
        crime: null, // missing
        accident: 85,
        activity: 75,
        timeOfDay: 100,
        emergencyNearby: null, // missing
      };

      const result = calculateSafetyScore(input, { coveragePercentage: 0.8 });

      assert.strictEqual(result.factors.crime.status, 'unknown');
      assert.strictEqual(result.factors.crime.isKnown, false);
      assert.strictEqual(result.factors.emergencyNearby.status, 'unknown');

      // The remaining 4 factors (lighting: 0.25, accident: 0.20, activity: 0.10, timeOfDay: 0.10) sum to 0.65
      // Effective weights must sum to exactly 1.0 (100%)
      const effectiveSum =
        result.factors.lighting.effectiveWeight +
        result.factors.accident.effectiveWeight +
        result.factors.activity.effectiveWeight +
        result.factors.timeOfDay.effectiveWeight;

      assert.strictEqual(Math.round(effectiveSum * 100), 100, 'Effective weights must sum to 100%');
      assert.strictEqual(result.weightsTotal, 100);
      assert.ok(result.score !== null);
    });

    test('4c. normalizeWeights helper normalizes arbitrary weights to 1.0', () => {
      const custom = normalizeWeights({
        lighting: 50,
        crime: 50,
        accident: 0,
        activity: 0,
        timeOfDay: 0,
        emergencyNearby: 0,
      });

      assert.strictEqual(custom.lighting, 0.5);
      assert.strictEqual(custom.crime, 0.5);
      const sum = Object.values(custom).reduce((a, b) => a + b, 0);
      assert.strictEqual(Math.round(sum * 100), 100);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Risk Level Cutoff Thresholds (>=75 Low, 50-74 Moderate, <50 High)
  // --------------------------------------------------------------------------
  describe('5. Risk Level Threshold Classification', () => {
    test('5a. Correctly classifies Low (>=75), Moderate (50-74), and High (<50)', () => {
      assert.strictEqual(determineRiskLevel(90, 1.0), 'Low');
      assert.strictEqual(determineRiskLevel(75, 1.0), 'Low');
      assert.strictEqual(determineRiskLevel(74.9, 1.0), 'Moderate');
      assert.strictEqual(determineRiskLevel(60, 1.0), 'Moderate');
      assert.strictEqual(determineRiskLevel(50, 1.0), 'Moderate');
      assert.strictEqual(determineRiskLevel(49.9, 1.0), 'High');
      assert.strictEqual(determineRiskLevel(25, 1.0), 'High');
      assert.strictEqual(determineRiskLevel(0, 1.0), 'High');
    });

    test('5b. Insufficient coverage (<0.60) overrides score and returns "Insufficient data"', () => {
      assert.strictEqual(determineRiskLevel(95, 0.59), 'Insufficient data');
      assert.strictEqual(determineRiskLevel(80, 0.4), 'Insufficient data');
      assert.strictEqual(determineRiskLevel(null, 1.0), 'Insufficient data');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Route Sampling with Turf.js (@turf/along)
  // --------------------------------------------------------------------------
  describe('6. Route Point Sampling (@turf/along)', () => {
    test('6a. Samples points every ~200m along a multi-kilometer route', () => {
      // Route between The Loop and Lincoln Park (~4.5 km)
      const loopToLincolnPark: Array<[number, number]> = [
        [-87.6278, 41.8819], // The Loop
        [-87.6244, 41.8924], // Michigan Ave Bridge
        [-87.6255, 41.903], // Gold Coast
        [-87.636, 41.9214], // Lincoln Park
      ];

      const points = sampleRoutePoints(loopToLincolnPark, 200);

      assert.ok(points.length > 5, 'Must generate multiple sample points along 4.5km path');
      // Start point matches
      assert.strictEqual(points[0][0], loopToLincolnPark[0][0]);
      assert.strictEqual(points[0][1], loopToLincolnPark[0][1]);
      // End point matches
      const last = points[points.length - 1];
      const targetLast = loopToLincolnPark[loopToLincolnPark.length - 1];
      assert.strictEqual(last[0], targetLast[0]);
      assert.strictEqual(last[1], targetLast[1]);

      // All points have valid WGS84 coordinates
      for (const pt of points) {
        assert.ok(pt[0] >= -180 && pt[0] <= 180, 'Longitude in bounds');
        assert.ok(pt[1] >= -90 && pt[1] <= 90, 'Latitude in bounds');
      }
    });

    test('6b. Handles single point and zero-length route gracefully', () => {
      const single: Array<[number, number]> = [[-87.6278, 41.8819]];
      const sampledSingle = sampleRoutePoints(single, 200);
      assert.strictEqual(sampledSingle.length, 1);

      const empty: Array<[number, number]> = [];
      const sampledEmpty = sampleRoutePoints(empty, 200);
      assert.strictEqual(sampledEmpty.length, 0);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Full Route Evaluation & $geoNear Aggregation
  // --------------------------------------------------------------------------
  describe('7. Route Safety Evaluation with Database Geospatial Queries', () => {
    test('7a. Evaluates route through Chicago corridor using live $geoNear lookups', async () => {
      // Route along Michigan Avenue corridor
      const michiganAveRoute: Array<[number, number]> = [
        [-87.6244, 41.8924], // Mag Mile
        [-87.6241, 41.8865], // Chicago River
        [-87.6248, 41.8824], // Millennium Park
      ];

      const evaluation = await evaluateRouteSafetyScore({
        coordinates: michiganAveRoute,
        departureTime: '14:00', // Daytime
        sampleIntervalMeters: 200,
        searchRadiusMeters: 250,
      });

      assert.ok(evaluation.totalDistanceKm > 0, 'Distance must be calculated');
      assert.ok(evaluation.samplePointsCount >= 2, 'Must have at least 2 sample points');
      assert.ok(evaluation.coveragePercentage >= 60, 'Seeded Chicago corridor must have >=60% data coverage');
      assert.strictEqual(evaluation.hasSufficientData, true);
      assert.strictEqual(evaluation.status, 'sufficient');
      assert.ok(evaluation.score !== null && evaluation.score >= 0 && evaluation.score <= 100);
      assert.ok(['Low', 'Moderate', 'High'].includes(evaluation.riskLevel));

      // Factor breakdown verification
      assert.strictEqual(evaluation.factors.timeOfDay.score, 100, 'Day departure should have timeOfDay = 100');
      assert.ok(evaluation.factors.lighting.score !== null);
      assert.ok(evaluation.factors.crime.score !== null);
      assert.ok(evaluation.factors.accident.score !== null);
      assert.ok(evaluation.factors.emergencyNearby.score !== null);
    });

    test('7b. Detects night-time departure degradation on identical route geometry', async () => {
      const route: Array<[number, number]> = [
        [-87.6278, 41.8821],
        [-87.6293, 41.8805],
      ];

      const dayEval = await evaluateRouteSafetyScore({
        coordinates: route,
        departureTime: 'day',
      });

      const nightEval = await evaluateRouteSafetyScore({
        coordinates: route,
        departureTime: 'night',
      });

      assert.strictEqual(dayEval.factors.timeOfDay.score, 100);
      assert.strictEqual(nightEval.factors.timeOfDay.score, 40);
      assert.ok(
        (nightEval.score as number) < (dayEval.score as number),
        `Night score (${nightEval.score}) should be lower than day score (${dayEval.score})`
      );
    });

    test('7c. Flags remote/empty region with "Insufficient data" when coverage is below 60%', async () => {
      // Remote point in Pacific Ocean with zero safety records in database
      const remotePacificRoute: Array<[number, number]> = [
        [-160.0, 20.0],
        [-160.01, 20.01],
      ];

      const remoteEval = await evaluateRouteSafetyScore({
        coordinates: remotePacificRoute,
        searchRadiusMeters: 250,
      });

      assert.strictEqual(remoteEval.samplePointsWithDataCount, 0);
      assert.strictEqual(remoteEval.coveragePercentage, 0);
      assert.strictEqual(remoteEval.hasSufficientData, false);
      assert.strictEqual(remoteEval.riskLevel, 'Insufficient data');
      assert.strictEqual(remoteEval.status, 'Insufficient data');
      assert.strictEqual(remoteEval.score, null);
    });
  });
});
