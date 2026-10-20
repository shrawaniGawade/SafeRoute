import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  recommendRoute,
  calculateDetourLimit,
  generateFactorReasons,
  getDurationMinutes,
  getSafetyScore,
  isInsufficientData,
  DISCLAIMER_TEXT,
  RouteInputForRecommendation,
} from '../services/recommendationService';

describe('ISSUE-14: Route Recommendation and Explanation Suite (FR-5.1 - FR-5.5, FR-4.8)', () => {
  // --------------------------------------------------------------------------
  // 1. Acceptance Criteria 1: Detour Filter (Safest route too slow)
  // --------------------------------------------------------------------------
  describe('1. Acceptance Criteria 1: Detour Filter (Safest route too slow)', () => {
    test('1a. Excludes route that exceeds default detour limit (min of +25% or +10 min)', () => {
      // Fastest: 10 mins. Default detour limit: min(10 * 0.25 = 2.5 min, 10 min) = 2.5 min.
      // Max allowed duration = 12.5 mins.
      const routes: RouteInputForRecommendation[] = [
        { id: 'route-1', name: 'Route A', durationMinutes: 10, safety_score: 70 }, // fastest
        { id: 'route-2', name: 'Route B', durationMinutes: 12, safety_score: 80 }, // +2 min <= 2.5 min -> eligible
        { id: 'route-3', name: 'Route C', durationMinutes: 20, safety_score: 95 }, // +10 min > 2.5 min -> too slow!
      ];

      const result = recommendRoute(routes);

      // Route C is the safest (95), but it is too slow. Route B (80) should be recommended.
      assert.strictEqual(result.hasEligibleRoute, true);
      assert.strictEqual(result.recommendedIndex, 1);
      assert.strictEqual(result.recommendedRouteId, 'route-2');
      assert.strictEqual(result.recommendedRoute?.id, 'route-2');
      assert.strictEqual(result.routes[1].isRecommended, true);
      assert.strictEqual(result.routes[2].isRecommended, false);
      assert.strictEqual(result.metadata.eligibleCount, 2);
    });

    test('1b. Respects custom maxDetour in minutes', () => {
      // Fastest: 15 mins. Custom maxDetour: 3 mins. Max allowed: 18 mins.
      const routes: RouteInputForRecommendation[] = [
        { id: 'route-fast', name: 'Route Fast', durationMinutes: 15, safety_score: 65 },
        { id: 'route-safe-1', name: 'Route Safe 1', durationMinutes: 17, safety_score: 85 }, // +2 min <= 3 min
        { id: 'route-safe-2', name: 'Route Safe 2', durationMinutes: 19, safety_score: 95 }, // +4 min > 3 min
      ];

      const result = recommendRoute(routes, 3);

      assert.strictEqual(result.recommendedIndex, 1);
      assert.strictEqual(result.recommendedRouteId, 'route-safe-1');
      assert.strictEqual(result.metadata.detourLimitMinutes, 3);
      assert.strictEqual(result.metadata.maxAllowedDurationMinutes, 18);
    });

    test('1c. Respects user preference object ({ maxDetourPct, maxDetourMin })', () => {
      // Fastest: 20 mins. maxDetourPct: 20% (4 mins), maxDetourMin: 3 mins -> min is 3 mins.
      const routes: RouteInputForRecommendation[] = [
        { id: 'r1', durationMinutes: 20, safety_score: 60 },
        { id: 'r2', durationMinutes: 22, safety_score: 82 }, // +2 min <= 3 min
        { id: 'r3', durationMinutes: 24, safety_score: 96 }, // +4 min > 3 min
      ];

      const result = recommendRoute(routes, { maxDetourPct: 20, maxDetourMin: 3 });

      assert.strictEqual(result.recommendedIndex, 1);
      assert.strictEqual(result.recommendedRouteId, 'r2');
      assert.strictEqual(result.metadata.detourLimitMinutes, 3);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Acceptance Criteria 2: Tie-break rule within 2 points
  // --------------------------------------------------------------------------
  describe('2. Acceptance Criteria 2: Tie-Breaking Rule (Scores within 2 points)', () => {
    test('2a. Given two routes with scores 85 and 84, the faster one is recommended', () => {
      const routes: RouteInputForRecommendation[] = [
        { id: 'route-faster', name: 'Route A', durationMinutes: 10, safety_score: 84 },
        { id: 'route-slower', name: 'Route B', durationMinutes: 12, safety_score: 85 },
      ];

      // Difference is Math.abs(85 - 84) = 1 <= 2.
      // Route A is faster (10 min vs 12 min), so Route A should win despite score 84 vs 85.
      const result = recommendRoute(routes);

      assert.strictEqual(result.recommendedIndex, 0);
      assert.strictEqual(result.recommendedRouteId, 'route-faster');
      assert.strictEqual(result.routes[0].isRecommended, true);
      assert.strictEqual(result.routes[1].isRecommended, false);
    });

    test('2b. Given score difference of exactly 2 (85 and 83), the faster one is recommended', () => {
      const routes: RouteInputForRecommendation[] = [
        { id: 'route-faster', name: 'Route A', durationMinutes: 14, safety_score: 83 },
        { id: 'route-slower', name: 'Route B', durationMinutes: 16, safety_score: 85 },
      ];

      const result = recommendRoute(routes);

      assert.strictEqual(result.recommendedIndex, 0);
      assert.strictEqual(result.recommendedRouteId, 'route-faster');
    });

    test('2c. Given score difference > 2 (86 and 83), the higher score wins even if slower', () => {
      const routes: RouteInputForRecommendation[] = [
        { id: 'route-faster', name: 'Route A', durationMinutes: 10, safety_score: 83 },
        { id: 'route-slower', name: 'Route B', durationMinutes: 12, safety_score: 86 },
      ];

      // Difference is 3 > 2. Higher score wins.
      const result = recommendRoute(routes);

      assert.strictEqual(result.recommendedIndex, 1);
      assert.strictEqual(result.recommendedRouteId, 'route-slower');
    });

    test('2d. Equal duration and equal scores breaks tie by original index cleanly', () => {
      const routes: RouteInputForRecommendation[] = [
        { id: 'r1', durationMinutes: 15, safety_score: 85 },
        { id: 'r2', durationMinutes: 15, safety_score: 85 },
      ];

      const result = recommendRoute(routes);
      assert.strictEqual(result.recommendedIndex, 0);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Acceptance Criteria 3: One-line summary reason
  // --------------------------------------------------------------------------
  describe('3. Acceptance Criteria 3: One-Line Summary Reason', () => {
    test('3a. Generates exact one-line reason comparing time and safety delta vs fastest', () => {
      const routes: RouteInputForRecommendation[] = [
        { id: 'fastest', name: 'Route A', durationMinutes: 10, safety_score: 55 },
        { id: 'recommended', name: 'Route B', durationMinutes: 12, safety_score: 84 },
      ];

      const result = recommendRoute(routes);

      // Expected: "Route B is recommended: +2 min vs fastest, +29 safety points."
      assert.ok(result.explanation.summary.includes('Route B is recommended:'));
      assert.ok(result.explanation.summary.includes('+2 min vs fastest'));
      assert.ok(result.explanation.summary.includes('+29 safety points'));
      assert.strictEqual(result.statusMessage, result.explanation.summary);
      assert.strictEqual(result.explanation.disclaimer, DISCLAIMER_TEXT);
    });

    test('3b. Generates summary when fastest route itself is the safest', () => {
      const routes: RouteInputForRecommendation[] = [
        { id: 'route-a', name: 'Route A', durationMinutes: 10, safety_score: 92 },
        { id: 'route-b', name: 'Route B', durationMinutes: 14, safety_score: 75 },
      ];

      const result = recommendRoute(routes);

      assert.strictEqual(result.recommendedIndex, 0);
      assert.ok(result.explanation.summary.includes('Route A is recommended:'));
      assert.ok(result.explanation.summary.includes('Fastest route with the highest safety score'));
    });

    test('3c. Populates recommendationReason on the winning route item', () => {
      const routes: RouteInputForRecommendation[] = [
        { id: 'r1', name: 'Route A', durationMinutes: 10, safety_score: 60 },
        { id: 'r2', name: 'Route B', durationMinutes: 12, safety_score: 88 },
      ];

      const result = recommendRoute(routes);

      assert.strictEqual(result.routes[0].recommendationReason, undefined);
      assert.ok(typeof result.routes[1].recommendationReason === 'string');
      assert.ok(result.routes[1].recommendationReason?.includes('+2 min vs fastest'));
    });
  });

  // --------------------------------------------------------------------------
  // 4. Acceptance Criteria 4: No eligible route handling
  // --------------------------------------------------------------------------
  describe('4. Acceptance Criteria 4: No Eligible Route Handling', () => {
    test('4a. When all routes exceed detour limit, returns "No route meets your detour limit."', () => {
      // Fastest: 10 mins. Custom limit: 1 min.
      // Other routes: 15 min, 20 min (both > 11 min).
      // If fastest route also has insufficient data:
      const routes: RouteInputForRecommendation[] = [
        { id: 'r1', durationMinutes: 10, safety_score: 80, isInsufficientData: true },
        { id: 'r2', durationMinutes: 16, safety_score: 90 }, // +6 min > 1 min
        { id: 'r3', durationMinutes: 20, safety_score: 95 }, // +10 min > 1 min
      ];

      const result = recommendRoute(routes, 1);

      assert.strictEqual(result.hasEligibleRoute, false);
      assert.strictEqual(result.recommendedIndex, -1);
      assert.strictEqual(result.recommendedRouteId, null);
      assert.strictEqual(result.recommendedRoute, null);
      assert.strictEqual(result.statusMessage, 'No route meets your detour limit.');
      assert.strictEqual(
        result.explanation.summary,
        'No route meets your detour limit. Showing all options.'
      );
      // All routes returned without recommended flag
      assert.strictEqual(result.routes.length, 3);
      assert.ok(result.routes.every((r) => r.isRecommended === false));
    });

    test('4b. Handles empty routes array gracefully', () => {
      const result = recommendRoute([]);

      assert.strictEqual(result.hasEligibleRoute, false);
      assert.strictEqual(result.recommendedIndex, -1);
      assert.strictEqual(result.recommendedRouteId, null);
      assert.strictEqual(result.routes.length, 0);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Insufficient Data Filtering (FR-5.2)
  // --------------------------------------------------------------------------
  describe('5. Data Sufficiency Filtering (FR-5.2)', () => {
    test('5a. Excludes route with rating "Insufficient data" regardless of score', () => {
      const routes: RouteInputForRecommendation[] = [
        { id: 'r1', name: 'Route A', durationMinutes: 10, safety_score: 75 },
        { id: 'r2', name: 'Route B', durationMinutes: 11, safety_score: 95, rating: 'Insufficient data' },
      ];

      const result = recommendRoute(routes);

      assert.strictEqual(result.recommendedIndex, 0);
      assert.strictEqual(result.recommendedRouteId, 'r1');
    });

    test('5b. Excludes route with coveragePercentage < 0.6', () => {
      const routes: RouteInputForRecommendation[] = [
        { id: 'r1', name: 'Route A', durationMinutes: 10, safety_score: 75, coveragePercentage: 0.9 },
        { id: 'r2', name: 'Route B', durationMinutes: 11, safety_score: 95, coveragePercentage: 0.45 },
      ];

      const result = recommendRoute(routes);

      assert.strictEqual(result.recommendedIndex, 0);
      assert.strictEqual(result.recommendedRouteId, 'r1');
    });

    test('5c. Excludes route with null or NaN safety score', () => {
      const routes: RouteInputForRecommendation[] = [
        { id: 'r1', durationMinutes: 10, safety_score: 78 },
        { id: 'r2', durationMinutes: 11, safety_score: null },
      ];

      const result = recommendRoute(routes);
      assert.strictEqual(result.recommendedIndex, 0);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Factor Reason Lines Generation (FR-4.8)
  // --------------------------------------------------------------------------
  describe('6. Per-Factor Reason Lines Generation (FR-4.8)', () => {
    test('6a. Generates reason lines for all standard safety factors', () => {
      const factors = {
        lighting: 85,
        crime: 90,
        accident: 88,
        activity: 75,
        emergencyNearby: 92,
        timeOfDay: 100,
      };

      const reasons = generateFactorReasons(factors);

      assert.strictEqual(reasons.length, 6);

      const lightingItem = reasons.find((r) => r.factor === 'Lighting');
      assert.ok(lightingItem);
      assert.strictEqual(lightingItem.score, 85);
      assert.ok(lightingItem.reason.includes('Lighting 85/100: well-lit roads'));

      const crimeItem = reasons.find((r) => r.factor === 'Crime Security');
      assert.ok(crimeItem);
      assert.strictEqual(crimeItem.score, 90);
      assert.ok(crimeItem.reason.includes('Crime Security 90/100: low incident density'));

      const emergItem = reasons.find((r) => r.factor === 'Emergency Proximity');
      assert.ok(emergItem);
      assert.strictEqual(emergItem.score, 92);
      assert.ok(emergItem.reason.includes('Emergency Proximity 92/100: rapid emergency dispatch'));
    });

    test('6b. Normalizes 0-10 factor scales into 0-100 scores', () => {
      const factors = {
        lighting: 9, // 9/10 -> 90/100
        crime_risk: 1, // crime_risk 1/10 -> 90/100
        accident_risk: 2, // accident_risk 2/10 -> 80/100
        crowd_level: 8, // 8/10 -> 80/100
        emergency_proximity: 7, // 7/10 -> 70/100
      };

      const reasons = generateFactorReasons(factors);

      const lighting = reasons.find((r) => r.factor === 'Lighting');
      assert.strictEqual(lighting?.score, 90);

      const crime = reasons.find((r) => r.factor === 'Crime Security');
      assert.strictEqual(crime?.score, 90);

      const accident = reasons.find((r) => r.factor === 'Traffic Safety');
      assert.strictEqual(accident?.score, 80);

      const activity = reasons.find((r) => r.factor === 'Pedestrian Activity');
      assert.strictEqual(activity?.score, 80);

      const emerg = reasons.find((r) => r.factor === 'Emergency Proximity');
      assert.strictEqual(emerg?.score, 70);
    });

    test('6c. Returns empty array for missing or null factors', () => {
      assert.deepStrictEqual(generateFactorReasons(undefined), []);
      assert.deepStrictEqual(generateFactorReasons(null as any), []);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Detour Limit Calculation Helper Tests
  // --------------------------------------------------------------------------
  describe('7. calculateDetourLimit Helper Tests', () => {
    test('7a. Calculates default limit as smaller of 25% or 10 minutes', () => {
      // 10 mins -> 25% is 2.5 min (< 10 min) -> 2.5 min
      assert.strictEqual(calculateDetourLimit(10), 2.5);

      // 40 mins -> 25% is 10 min (== 10 min) -> 10 min
      assert.strictEqual(calculateDetourLimit(40), 10);

      // 60 mins -> 25% is 15 min (> 10 min) -> 10 min (capped at 10)
      assert.strictEqual(calculateDetourLimit(60), 10);
    });

    test('7b. Direct number input overrides default', () => {
      assert.strictEqual(calculateDetourLimit(20, 5), 5);
      assert.strictEqual(calculateDetourLimit(20, 15), 15);
    });

    test('7c. Zero or negative duration returns fallback default', () => {
      assert.strictEqual(calculateDetourLimit(0), 10);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Duration Extraction Helper Tests
  // --------------------------------------------------------------------------
  describe('8. getDurationMinutes Helper Tests', () => {
    test('8a. Extracts from durationMinutes numeric property', () => {
      assert.strictEqual(getDurationMinutes({ id: '1', durationMinutes: 18 }), 18);
    });

    test('8b. Extracts and converts seconds from duration property', () => {
      // 900 seconds = 15 minutes
      assert.strictEqual(getDurationMinutes({ id: '1', duration: 900 }), 15);
    });

    test('8c. Parses duration strings (e.g. "12 mins", "1.5 hours")', () => {
      assert.strictEqual(getDurationMinutes({ id: '1', durationText: '12 mins' }), 12);
      assert.strictEqual(getDurationMinutes({ id: '1', durationText: '1.5 hours' }), 90);
    });
  });
});
