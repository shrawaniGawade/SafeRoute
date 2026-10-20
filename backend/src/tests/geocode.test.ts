import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../server';
import { searchLocations, clearGeocodeCache, getGeocodeCacheSize } from '../services/geocodingService';

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
});
