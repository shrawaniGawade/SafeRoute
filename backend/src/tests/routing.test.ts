import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRouteAlternatives,
  clearRouteCache,
  getRouteCacheSize,
  ROUTE_CACHE_TTL_MS,
} from '../services/routingService';

test('SafeRoute Routing & Alternative Routes Service Test Suite (ISSUE-10)', async (t) => {
  t.beforeEach(() => {
    clearRouteCache();
  });

  await t.test('1. Generates up to 3 structured alternative routes in demonstration mode', async () => {
    const result = await getRouteAlternatives(
      'North Station, Boston, MA',
      'Boston Public Library, Boston, MA',
      'walking'
    );

    assert.ok(result);
    assert.strictEqual(result.provider, 'synthetic_demo');
    assert.strictEqual(result.routes.length, 3, 'Must provide 3 alternative routes (Route A, B, C)');

    const [routeA, routeB, routeC] = result.routes;

    // Route A checks
    assert.strictEqual(routeA.id, 'alt_safe_corridor');
    assert.strictEqual(routeA.letter, 'A');
    assert.strictEqual(routeA.isRecommended, true);
    assert.strictEqual(routeA.type, 'safe_corridor');
    assert.ok(routeA.distanceText.includes('km'));
    assert.ok(routeA.durationText.includes('mins'));
    assert.strictEqual(routeA.color, '#087f8c');

    // Route B checks
    assert.strictEqual(routeB.id, 'alt_balanced_transit');
    assert.strictEqual(routeB.letter, 'B');
    assert.strictEqual(routeB.isRecommended, false);
    assert.strictEqual(routeB.type, 'balanced_transit');
    assert.strictEqual(routeB.color, '#8b5cf6');

    // Route C checks
    assert.strictEqual(routeC.id, 'alt_direct_shortcut');
    assert.strictEqual(routeC.letter, 'C');
    assert.strictEqual(routeC.isRecommended, false);
    assert.strictEqual(routeC.type, 'direct_shortcut');
    assert.strictEqual(routeC.color, '#f59e0b');
  });

  await t.test('2. Caches identical searches for 10 minutes (TTL = 600,000ms)', async () => {
    assert.strictEqual(getRouteCacheSize(), 0);

    // First call: Populates cache
    const firstCall = await getRouteAlternatives(
      'Union Station, Chicago',
      'Millennium Park, Chicago',
      'walking'
    );
    assert.strictEqual(getRouteCacheSize(), 1);

    // Second call with identical locations: Served from cache
    const secondCall = await getRouteAlternatives(
      'union station, chicago ', // Leading/trailing space and casing variation
      ' Millennium Park, Chicago',
      'WALKING'
    );

    assert.strictEqual(getRouteCacheSize(), 1, 'Cache size should remain 1 for identical normalized search');
    assert.deepStrictEqual(secondCall, firstCall);

    // Different search parameters: Bypasses cache and increments size
    await getRouteAlternatives(
      'O’Hare Airport',
      'Navy Pier',
      'driving'
    );
    assert.strictEqual(getRouteCacheSize(), 2);
  });

  await t.test('3. Clears in-memory route cache on command', async () => {
    await getRouteAlternatives('Point A', 'Point B');
    assert.strictEqual(getRouteCacheSize(), 1);

    clearRouteCache();
    assert.strictEqual(getRouteCacheSize(), 0);
  });

  await t.test('4. Preserves travel mode duration estimates between walking and driving', async () => {
    const walkingResult = await getRouteAlternatives('Origin A', 'Destination B', 'walking');
    const drivingResult = await getRouteAlternatives('Origin A', 'Destination B', 'driving');

    assert.ok(walkingResult.routes[0].durationMinutes! > drivingResult.routes[0].durationMinutes!);
    assert.ok(walkingResult.routes[0].durationText.includes('22 mins'));
    assert.ok(drivingResult.routes[0].durationText.includes('7 mins'));
  });

  await t.test('5. Supports custom factor overrides for lighting, crime, and crowd levels', async () => {
    const customResult = await getRouteAlternatives('Origin X', 'Destination Y', 'walking', {
      lighting: 10,
      crime_risk: 0.5,
      accident_risk: 1.0,
      crowd_level: 9.5,
      emergency_proximity: 9.0,
    });

    const routeA = customResult.routes[0];
    assert.strictEqual(routeA.factors.lighting, 10);
    assert.strictEqual(routeA.factors.crime_risk, 0.5);
    assert.strictEqual(routeA.factors.crowd_level, 9.5);
  });
});
