import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../server';
import {
  setMockRoutingProvider,
  mapProviderError,
  RoutingError,
} from '../services/routingService';

let server: http.Server;
let baseUrl: string;

describe('SafeRoute Route Search Error & Status Codes Test Suite (ISSUE-11)', () => {
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

  afterEach(() => {
    setMockRoutingProvider(null);
  });

  test('1. mapProviderError maps provider errors to clear status codes and messages', () => {
    // 429 Rate Limit
    const err429 = mapProviderError({ response: { status: 429 } });
    assert.strictEqual(err429.statusCode, 429);
    assert.strictEqual(err429.code, 'RATE_LIMIT_EXCEEDED');
    assert.strictEqual(err429.message, 'Route service is busy. Please retry in a minute.');

    // 404 / No Route Found via status code
    const err404 = mapProviderError({ response: { status: 404 } });
    assert.strictEqual(err404.statusCode, 404);
    assert.strictEqual(err404.code, 'NO_ROUTE_FOUND');
    assert.strictEqual(err404.message, 'No route available between these points.');

    // 404 via ORS error code 2010 (Could not find point within distance)
    const errOrs2010 = mapProviderError({ response: { data: { error: { code: 2010 } } } });
    assert.strictEqual(errOrs2010.statusCode, 404);
    assert.strictEqual(errOrs2010.message, 'No route available between these points.');

    // 404 via OSRM NoRoute code
    const errOsrmNoRoute = mapProviderError({ response: { data: { code: 'NoRoute' } } });
    assert.strictEqual(errOsrmNoRoute.statusCode, 404);
    assert.strictEqual(errOsrmNoRoute.message, 'No route available between these points.');

    // 503 / Network / Provider down
    const err503 = mapProviderError({ response: { status: 503 } });
    assert.strictEqual(err503.statusCode, 503);
    assert.strictEqual(err503.code, 'SERVICE_UNAVAILABLE');
    assert.strictEqual(err503.message, "Couldn't load routes.");

    const errNetwork = mapProviderError(new Error('connect ECONNREFUSED 127.0.0.1:5000'));
    assert.strictEqual(errNetwork.statusCode, 503);
    assert.strictEqual(errNetwork.message, "Couldn't load routes.");
  });

  test('2. POST /api/safety/predict returns 429 when routing provider is rate-limited', async () => {
    setMockRoutingProvider(() => {
      throw new RoutingError(429, 'RATE_LIMIT_EXCEEDED', 'Route service is busy. Please retry in a minute.');
    });

    const res = await fetch(`${baseUrl}/api/safety/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'North Station, Boston, MA',
        destination: 'Boston Public Library, MA',
        lighting: 8,
        crime_risk: 2,
        accident_risk: 2,
        crowd_level: 7,
      }),
    });

    const body = (await res.json()) as any;
    assert.strictEqual(res.status, 429, 'Must return HTTP 429 when routing provider hits rate limit');
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.code, 'RATE_LIMIT_EXCEEDED');
    assert.strictEqual(body.message, 'Route service is busy. Please retry in a minute.');
  });

  test('3. POST /api/safety/predict returns 404 when no routes exist between locations', async () => {
    setMockRoutingProvider(() => {
      return {
        provider: 'openrouteservice',
        isRealRoutingData: true,
        isNavigable: false,
        navigabilityNotice: 'No routes found.',
        origin: 'Remote Point A',
        destination: 'Remote Point B',
        travelMode: 'walking',
        routes: [],
      };
    });

    const res = await fetch(`${baseUrl}/api/safety/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Remote Point A',
        destination: 'Remote Point B',
        lighting: 7,
        crime_risk: 3,
        accident_risk: 2,
        crowd_level: 5,
      }),
    });

    const body = (await res.json()) as any;
    assert.strictEqual(res.status, 404, 'Must return HTTP 404 when no routes are found');
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.code, 'NO_ROUTES_FOUND');
    assert.strictEqual(body.message, 'No route available between these points.');
  });

  test('4. POST /api/safety/predict returns 503 when routing provider service is unavailable', async () => {
    setMockRoutingProvider(() => {
      throw new RoutingError(503, 'SERVICE_UNAVAILABLE', "Couldn't load routes.");
    });

    const res = await fetch(`${baseUrl}/api/safety/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Station A',
        destination: 'Station B',
        lighting: 8,
        crime_risk: 2,
        accident_risk: 1,
        crowd_level: 8,
      }),
    });

    const body = (await res.json()) as any;
    assert.strictEqual(res.status, 503, 'Must return HTTP 503 when provider is unavailable');
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.code, 'SERVICE_UNAVAILABLE');
    assert.strictEqual(body.message, "Couldn't load routes.");
  });

  test('5. POST /api/routes/search endpoint supports route search with clean status codes', async () => {
    // 429 check on /api/routes/search
    setMockRoutingProvider(() => {
      throw new RoutingError(429, 'RATE_LIMIT_EXCEEDED', 'Route service is busy. Please retry in a minute.');
    });

    const res429 = await fetch(`${baseUrl}/api/routes/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Point A',
        destination: 'Point B',
        lighting: 8,
        crime_risk: 2,
        accident_risk: 2,
        crowd_level: 7,
      }),
    });

    const body429 = (await res429.json()) as any;
    assert.strictEqual(res429.status, 429);
    assert.strictEqual(body429.message, 'Route service is busy. Please retry in a minute.');

    // 404 check on /api/routes/search
    setMockRoutingProvider(() => {
      throw new RoutingError(404, 'NO_ROUTE_FOUND', 'No route available between these points.');
    });

    const res404 = await fetch(`${baseUrl}/api/routes/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Point A',
        destination: 'Point B',
        lighting: 8,
        crime_risk: 2,
        accident_risk: 2,
        crowd_level: 7,
      }),
    });

    const body404 = (await res404.json()) as any;
    assert.strictEqual(res404.status, 404);
    assert.strictEqual(body404.message, 'No route available between these points.');
  });

  test('6. POST /api/safety/predict succeeds with single route (1 route returned)', async () => {
    setMockRoutingProvider(() => {
      return {
        provider: 'openrouteservice',
        isRealRoutingData: true,
        isNavigable: true,
        navigabilityNotice: 'Navigable road corridor.',
        origin: 'Origin Point',
        destination: 'Destination Point',
        travelMode: 'walking',
        routes: [
          {
            id: 'single_route_0',
            letter: 'A',
            name: 'Route A: Only Available Corridor',
            summary: 'Sole navigable passage between points',
            type: 'safe_corridor',
            isRecommended: true,
            isRealRoutingData: true,
            isNavigable: true,
            distanceKm: 2.4,
            distanceText: '2.4 km',
            durationMinutes: 30,
            durationText: '30 mins',
            factors: {
              lighting: 8.5,
              crime_risk: 2.0,
              accident_risk: 2.5,
              crowd_level: 7.0,
              emergency_proximity: 8.0,
            },
            safetyAttributes: ['Streetlight Coverage'],
            caveats: ['Sole provider corridor'],
          },
        ],
      };
    });

    const res = await fetch(`${baseUrl}/api/safety/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Origin Point',
        destination: 'Destination Point',
        lighting: 8,
        crime_risk: 2,
        accident_risk: 2,
        crowd_level: 7,
      }),
    });

    const body = (await res.json()) as any;
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.alternatives.length, 1);
    assert.strictEqual(body.data.alternatives[0].id, 'single_route_0');
  });
});
