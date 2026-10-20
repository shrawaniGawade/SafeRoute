import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../server';
import {
  searchLocations,
  clearGeocodeCache,
  getGeocodeCacheSize,
  geocode,
  suggest,
  reverseGeocode,
  parseDirectCoordinates,
  isValidCoordinate,
} from '../services/geocodingService';

let server: http.Server;
let baseUrl: string;

describe('SafeRoute Geocoding API & Location Search Suite', () => {
  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  test('1. GET /api/geocode?q=Cent returns matching location suggestions', async () => {
    const res = await fetch(`${baseUrl}/api/geocode?q=Cent`);
    assert.equal(res.status, 200);

    const data = (await res.json()) as any;
    assert.equal(data.success, true);
    assert.equal(data.query, 'Cent');
    assert.ok(Array.isArray(data.results));
    assert.ok(data.results.length >= 1, 'Should return matching results for Cent');

    const first = data.results[0];
    assert.ok(first.placeId, 'Must have placeId');
    assert.ok(first.name, 'Must have name');
    assert.ok(first.displayName, 'Must have displayName');
    assert.equal(typeof first.lat, 'number');
    assert.equal(typeof first.lng, 'number');
    assert.ok(first.lat >= -90 && first.lat <= 90);
    assert.ok(first.lng >= -180 && first.lng <= 180);
  });

  test('2. GET /api/geocode?q=ab rejects query shorter than 3 characters (400 Bad Request)', async () => {
    const res = await fetch(`${baseUrl}/api/geocode?q=ab`);
    assert.equal(res.status, 400);

    const data = (await res.json()) as any;
    assert.equal(data.success, false);
    assert.equal(data.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(data.errors));
    assert.ok(data.errors.some((e: any) => e.field === 'q'));
  });

  test('3. GET /api/geocode rejects missing query parameter (400 Bad Request)', async () => {
    const res = await fetch(`${baseUrl}/api/geocode`);
    assert.equal(res.status, 400);

    const data = (await res.json()) as any;
    assert.equal(data.success, false);
    assert.equal(data.code, 'VALIDATION_ERROR');
  });

  test('4. GET /api/geocode?q=xyz999nonexistentplace returns empty array with 200 status', async () => {
    const res = await fetch(`${baseUrl}/api/geocode?q=xyz999nonexistentplace`);
    assert.equal(res.status, 200);

    const data = (await res.json()) as any;
    assert.equal(data.success, true);
    assert.equal(data.count, 0);
    assert.deepEqual(data.results, []);
  });

  test('5. Respects limit query parameter', async () => {
    const res = await fetch(`${baseUrl}/api/geocode?q=Chicago&limit=2`);
    assert.equal(res.status, 200);

    const data = (await res.json()) as any;
    assert.equal(data.success, true);
    assert.ok(data.results.length <= 2, 'Should not exceed requested limit of 2');
  });

  test('6. In-memory caching stores queries and serves cached results', async () => {
    clearGeocodeCache();
    const initialSize = getGeocodeCacheSize();
    assert.equal(initialSize, 0);

    // First request
    const res1 = await fetch(`${baseUrl}/api/geocode?q=Millennium`);
    assert.equal(res1.status, 200);
    const data1 = (await res1.json()) as any;
    assert.ok(getGeocodeCacheSize() >= 1);

    // Second request (served from cache)
    const t0 = performance.now();
    const res2 = await fetch(`${baseUrl}/api/geocode?q=Millennium`);
    const duration = performance.now() - t0;
    assert.equal(res2.status, 200);
    const data2 = (await res2.json()) as any;

    assert.deepEqual(data1.results, data2.results);
    assert.ok(duration < 200, `Cached response must be fast, took ${duration}ms`);
  });

  test('7. Direct searchLocations unit logic handles whitespace trimming and case normalization', async () => {
    const res1 = await searchLocations('  central station  ', 3);
    const res2 = await searchLocations('CENTRAL STATION', 3);

    assert.ok(res1.length > 0);
    assert.ok(res2.length > 0);
    assert.equal(res1[0].displayName, res2[0].displayName);
  });

  test('8. Direct coordinate input parses without external API call and normalizes to GeoPoint', () => {
    const directValid = parseDirectCoordinates('19.0760, 72.8777');
    assert.ok(directValid, 'Must parse valid lat,lng coordinate string');
    assert.equal(directValid.lat, 19.076);
    assert.equal(directValid.lng, 72.8777);
    assert.equal(directValid.confidence, 1.0);
    assert.equal(directValid.type, 'coordinate');

    const withSpaces = parseDirectCoordinates('  -33.8688 ,  151.2093  ');
    assert.ok(withSpaces);
    assert.equal(withSpaces.lat, -33.8688);
    assert.equal(withSpaces.lng, 151.2093);
  });

  test('9. Coordinate range validation rejects out-of-bounds latitude and longitude', () => {
    assert.equal(isValidCoordinate(90, 180), true);
    assert.equal(isValidCoordinate(-90, -180), true);
    assert.equal(isValidCoordinate(0, 0), true);

    // Invalid ranges
    assert.equal(isValidCoordinate(90.1, 0), false, 'Lat > 90 must be invalid');
    assert.equal(isValidCoordinate(-91, 0), false, 'Lat < -90 must be invalid');
    assert.equal(isValidCoordinate(0, 180.1), false, 'Lng > 180 must be invalid');
    assert.equal(isValidCoordinate(0, -180.5), false, 'Lng < -180 must be invalid');
    assert.equal(isValidCoordinate(NaN as any, 50), false, 'NaN lat must be invalid');
    assert.equal(isValidCoordinate(50, NaN as any), false, 'NaN lng must be invalid');

    // parseDirectCoordinates rejects out-of-bounds coordinates
    assert.equal(parseDirectCoordinates('95.0, 72.0'), null);
    assert.equal(parseDirectCoordinates('20.0, 190.0'), null);
  });

  test('10. Empty or invalid query handling returns null gracefully', async () => {
    const emptyRes = await geocode('');
    assert.equal(emptyRes, null);

    const spaceRes = await geocode('   ');
    assert.equal(spaceRes, null);
  });

  test('11. geocode() resolves valid landmark to GeoPoint and caches result', async () => {
    const point = await geocode('Central Station, Chicago');
    assert.ok(point, 'Must resolve landmark to GeoPoint');
    assert.equal(typeof point.lat, 'number');
    assert.equal(typeof point.lng, 'number');
    assert.ok(point.confidence > 0);
    assert.ok(point.label.length > 0);

    // Repeated call hits cache
    const cachedPoint = await geocode('Central Station, Chicago');
    assert.deepEqual(cachedPoint, point);
  });

  test('12. reverseGeocode() converts coordinates to GeoPoint', async () => {
    const result = await reverseGeocode(41.8584, -87.6277);
    assert.ok(result);
    assert.equal(typeof result.label, 'string');
    assert.ok(result.label.length > 0);

    // Invalid coordinates return null
    const invalidRev = await reverseGeocode(999, 999);
    assert.equal(invalidRev, null);
  });

  test('13. suggest() returns GeoPoint suggestions or direct coordinate', async () => {
    const suggestions = await suggest('Chicago');
    assert.ok(Array.isArray(suggestions));
    assert.ok(suggestions.length > 0);
    assert.ok(suggestions[0].label);

    const directSuggest = await suggest('28.6139, 77.2090');
    assert.ok(Array.isArray(directSuggest));
    assert.equal(directSuggest.length, 1);
    assert.equal(directSuggest[0].lat, 28.6139);
  });

  test('14. GET /api/safety/geocode?q= supports autocomplete with validation', async () => {
    const res = await fetch(`${baseUrl}/api/safety/geocode?q=Boston`);
    assert.equal(res.status, 200);

    const data = (await res.json()) as any;
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.results));

    // Short query rejected with 400
    const shortRes = await fetch(`${baseUrl}/api/safety/geocode?q=a`);
    assert.equal(shortRes.status, 400);

    // Missing query rejected with 400
    const missingRes = await fetch(`${baseUrl}/api/safety/geocode`);
    assert.equal(missingRes.status, 400);
  });
});
