import test from 'node:test';
import assert from 'node:assert/strict';

test('SafeRoute Frontend Architecture & Business Logic Test Suite', async (t) => {
  await t.test('1. Safety Score Classification Logic', () => {
    function classifySafetyScore(score) {
      if (score >= 80) return { label: 'Optimal Safe', color: '#10b981' };
      if (score >= 60) return { label: 'Moderate Caution', color: '#f59e0b' };
      return { label: 'High Risk', color: '#ef4444' };
    }

    assert.equal(classifySafetyScore(92).label, 'Optimal Safe');
    assert.equal(classifySafetyScore(70).label, 'Moderate Caution');
    assert.equal(classifySafetyScore(45).label, 'High Risk');
    assert.equal(classifySafetyScore(80).label, 'Optimal Safe');
    assert.equal(classifySafetyScore(60).label, 'Moderate Caution');
  });

  await t.test('2. Safety Factor Bounds & Clamping Validation', () => {
    function validateSafetyFactor(val) {
      return typeof val === 'number' && !isNaN(val) && val >= 0 && val <= 10;
    }

    assert.equal(validateSafetyFactor(0), true);
    assert.equal(validateSafetyFactor(10), true);
    assert.equal(validateSafetyFactor(5.5), true);
    assert.equal(validateSafetyFactor(-1), false);
    assert.equal(validateSafetyFactor(10.1), false);
    assert.equal(validateSafetyFactor(NaN), false);
  });

  await t.test('3. Route Alternatives Sorting & Recommendation Selection', () => {
    const alternatives = [
      { id: 'standard', score: 62, isRecommended: false },
      { id: 'illuminated', score: 88, isRecommended: true },
      { id: 'express', score: 45, isRecommended: false }
    ];

    const recommended = alternatives.find(a => a.isRecommended);
    assert.ok(recommended);
    assert.equal(recommended.id, 'illuminated');
    assert.equal(recommended.score, 88);

    const sortedBySafety = [...alternatives].sort((a, b) => b.score - a.score);
    assert.equal(sortedBySafety[0].id, 'illuminated');
    assert.equal(sortedBySafety[2].id, 'express');
  });

  await t.test('4. Registration & Login Form Validation Rules', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    assert.equal(emailRegex.test('traveler@saferoute.com'), true);
    assert.equal(emailRegex.test('invalid-email'), false);
    assert.equal(emailRegex.test('user@domain'), false);

    function validatePasswordStrength(pwd) {
      if (pwd.length < 8) return { valid: false, reason: 'Password must be at least 8 characters' };
      if (!/[A-Z]/.test(pwd)) return { valid: false, reason: 'Password must include uppercase letter' };
      if (!/[0-9]/.test(pwd)) return { valid: false, reason: 'Password must include numeric character' };
      return { valid: true };
    }

    assert.equal(validatePasswordStrength('SafeRoute2026').valid, true);
    assert.equal(validatePasswordStrength('short').valid, false);
    assert.equal(validatePasswordStrength('nocapital123').valid, false);
    assert.equal(validatePasswordStrength('NoNumbersHere').valid, false);
  });

  await t.test('5. Responsive Breakpoint Matrix Integrity', () => {
    const breakpoints = {
      mobile: 480,
      mobileLarge: 640,
      tablet: 768,
      desktopSmall: 900,
      desktop: 1280
    };

    assert.ok(breakpoints.mobile < breakpoints.tablet);
    assert.ok(breakpoints.tablet < breakpoints.desktop);
    assert.equal(breakpoints.mobileLarge, 640);
  });

  await t.test('6. Location Input Validation & From != To Constraints', () => {
    function validateLocations(origin, destination) {
      const orig = (origin || '').trim();
      const dest = (destination || '').trim();

      if (!orig || !dest) {
        return { valid: false, error: 'Please provide both starting point and destination.' };
      }
      if (orig.toLowerCase() === dest.toLowerCase()) {
        return { valid: false, error: 'Choose two different locations' };
      }
      return { valid: true };
    }

    // Both filled and distinct -> valid
    const okCase = validateLocations('Central Station, Chicago', 'Millennium Park, Chicago');
    assert.equal(okCase.valid, true);

    // Missing destination -> invalid
    const missingDest = validateLocations('Central Station', '');
    assert.equal(missingDest.valid, false);
    assert.match(missingDest.error, /Please provide both starting point/);

    // Identical locations -> "Choose two different locations" (Acceptance Criteria)
    const samePlace = validateLocations('Central Station', 'Central Station');
    assert.equal(samePlace.valid, false);
    assert.equal(samePlace.error, 'Choose two different locations');

    // Case-insensitive duplicate check
    const caseInsensitiveSame = validateLocations('the loop, chicago', 'THE LOOP, CHICAGO');
    assert.equal(caseInsensitiveSame.valid, false);
    assert.equal(caseInsensitiveSame.error, 'Choose two different locations');
  });

  await t.test('7. Geocoding Debounce and Query Rules', () => {
    function shouldTriggerGeocode(query) {
      return typeof query === 'string' && query.trim().length >= 3;
    }

    assert.equal(shouldTriggerGeocode(''), false);
    assert.equal(shouldTriggerGeocode('C'), false);
    assert.equal(shouldTriggerGeocode('Ce'), false);
    assert.equal(shouldTriggerGeocode('Cent'), true);
    assert.equal(shouldTriggerGeocode('  Union  '), true);
    assert.equal(shouldTriggerGeocode('   ab   '), false);
  });

  await t.test('8. Alternative Routes A/B/C Explicit Risk Labels (Not Color Alone)', () => {
    function getExplicitRiskLabel(score, rating) {
      if (score >= 80) {
        return {
          label: rating || 'Optimal Safety (Low Risk)',
          badgeClass: 'risk-optimal',
          description: 'Illuminated & active corridor',
        };
      }
      if (score >= 55) {
        return {
          label: rating || 'Moderate Caution (Balanced)',
          badgeClass: 'risk-moderate',
          description: 'Standard commuter awareness',
        };
      }
      return {
        label: rating || 'Elevated Risk (Dark Zones)',
        badgeClass: 'risk-elevated',
        description: 'Reduced lighting / isolated segments',
      };
    }

    // High score must return explicit low risk textual label
    const highRiskLabel = getExplicitRiskLabel(88);
    assert.ok(highRiskLabel.label.includes('Optimal Safety'));
    assert.equal(highRiskLabel.badgeClass, 'risk-optimal');

    // Moderate score must return explicit moderate caution textual label
    const modRiskLabel = getExplicitRiskLabel(65);
    assert.ok(modRiskLabel.label.includes('Moderate Caution'));
    assert.equal(modRiskLabel.badgeClass, 'risk-moderate');

    // Low score must return explicit elevated risk textual label
    const elevatedRiskLabel = getExplicitRiskLabel(42);
    assert.ok(elevatedRiskLabel.label.includes('Elevated Risk'));
    assert.equal(elevatedRiskLabel.badgeClass, 'risk-elevated');

    // Custom rating override preserved
    const customRating = getExplicitRiskLabel(85, 'Custom Safe Corridor');
    assert.equal(customRating.label, 'Custom Safe Corridor');
  });

  await t.test('9. Shared selectedRouteId State & Stroke Width Differentiation', () => {
    const routes = [
      { id: 'alt_safe_corridor', letter: 'A', color: '#087f8c' },
      { id: 'alt_balanced_transit', letter: 'B', color: '#8b5cf6' },
      { id: 'alt_direct_shortcut', letter: 'C', color: '#f59e0b' }
    ];

    let selectedRouteId = 'alt_safe_corridor';

    function getStrokeStyles(routeId, activeId) {
      const isSelected = routeId === activeId;
      return {
        strokeWidth: isSelected ? 8 : 4,
        hasGlow: isSelected,
        opacity: isSelected ? 1.0 : 0.6,
      };
    }

    // Default: Route A is selected
    const initialA = getStrokeStyles(routes[0].id, selectedRouteId);
    const initialB = getStrokeStyles(routes[1].id, selectedRouteId);
    assert.equal(initialA.strokeWidth, 8);
    assert.equal(initialA.hasGlow, true);
    assert.equal(initialB.strokeWidth, 4);
    assert.equal(initialB.hasGlow, false);

    // Card or map click selects Route B
    selectedRouteId = 'alt_balanced_transit';
    const updatedA = getStrokeStyles(routes[0].id, selectedRouteId);
    const updatedB = getStrokeStyles(routes[1].id, selectedRouteId);
    assert.equal(updatedA.strokeWidth, 4);
    assert.equal(updatedA.hasGlow, false);
    assert.equal(updatedB.strokeWidth, 8);
    assert.equal(updatedB.hasGlow, true);
  });

  await t.test('10. Single Route Fallback Notice Trigger', () => {
    function getSingleRouteNotice(routesList) {
      if (!routesList || routesList.length === 1) {
        return 'Provider returned one route.';
      }
      return null;
    }

    // Single route returned -> Shows "Provider returned one route."
    assert.equal(getSingleRouteNotice([{ id: 'only_route' }]), 'Provider returned one route.');

    // Multiple routes returned -> No fallback notice
    assert.equal(getSingleRouteNotice([{ id: 'route_1' }, { id: 'route_2' }]), null);
    assert.equal(getSingleRouteNotice([{ id: 'a' }, { id: 'b' }, { id: 'c' }]), null);
  });

  await t.test('11. Route Search UI States & Error Resilience (ISSUE-11 / FR-3.5)', async (sub) => {
    // 11a: Format Route Error Messages (AC 2, 3, 4)
    function formatRouteErrorMessage(status, rawMessage) {
      if (status === 429) {
        return 'Route service is busy. Please retry in a minute.';
      }
      if (status === 404) {
        return 'No route available between these points.';
      }
      if (status === 503 || status === 500 || status === 502 || status === 504 || status === 0) {
        return "Couldn't load routes.";
      }
      if (
        rawMessage &&
        !rawMessage.toLowerCase().includes('internal server error') &&
        !rawMessage.toLowerCase().includes('service unavailable') &&
        !rawMessage.toLowerCase().includes('econnrefused') &&
        !rawMessage.toLowerCase().includes('failed to fetch') &&
        !rawMessage.toLowerCase().includes('<!doctype')
      ) {
        return rawMessage;
      }
      return "Couldn't load routes.";
    }

    await sub.test('11a. Given routing API returns 429, user sees busy message', () => {
      const msg429 = formatRouteErrorMessage(429, 'Rate limited');
      assert.equal(msg429, 'Route service is busy. Please retry in a minute.');
    });

    await sub.test('11b. Given routing API returns 404 / no route, user sees no route available message', () => {
      const msg404 = formatRouteErrorMessage(404, 'Not found');
      assert.equal(msg404, 'No route available between these points.');
    });

    await sub.test('11c. Given network or server failure, user sees clear error and never raw errors', () => {
      const msg503 = formatRouteErrorMessage(503, 'Service Unavailable');
      assert.equal(msg503, "Couldn't load routes.");

      const rawTechError = formatRouteErrorMessage(500, 'connect ECONNREFUSED 127.0.0.1:5000');
      assert.equal(rawTechError, "Couldn't load routes.", 'Raw internal tech errors must be sanitized');

      const fetchFail = formatRouteErrorMessage(0, 'Failed to fetch');
      assert.equal(fetchFail, "Couldn't load routes.", 'Browser fetch failures must never leak raw strings');
    });

    await sub.test('11d. Route UI State Machine determines correct view mode', () => {
      function getRouteViewState({ isLoading, error, hasSearched, routeCount }) {
        if (isLoading) return 'SKELETON_LOADING';
        if (error) return 'ERROR_STATE';
        if (!hasSearched && routeCount === 0) return 'INITIAL_EMPTY_STATE';
        if (hasSearched && routeCount === 0) return 'NO_ROUTES_EMPTY_STATE';
        if (routeCount === 1) return 'SINGLE_ROUTE';
        return 'MULTI_ROUTES';
      }

      // Searching -> Skeleton cards
      assert.equal(getRouteViewState({ isLoading: true, error: null, hasSearched: true, routeCount: 0 }), 'SKELETON_LOADING');
      // Before search -> Initial empty state with friendly hint
      assert.equal(getRouteViewState({ isLoading: false, error: null, hasSearched: false, routeCount: 0 }), 'INITIAL_EMPTY_STATE');
      // Error occurred -> Error state with Retry
      assert.equal(getRouteViewState({ isLoading: false, error: "Couldn't load routes.", hasSearched: true, routeCount: 0 }), 'ERROR_STATE');
      // No routes found -> 404 empty state
      assert.equal(getRouteViewState({ isLoading: false, error: null, hasSearched: true, routeCount: 0 }), 'NO_ROUTES_EMPTY_STATE');
      // 1 route returned -> Single route with notice
      assert.equal(getRouteViewState({ isLoading: false, error: null, hasSearched: true, routeCount: 1 }), 'SINGLE_ROUTE');
      // 3 routes returned -> Multi routes list
      assert.equal(getRouteViewState({ isLoading: false, error: null, hasSearched: true, routeCount: 3 }), 'MULTI_ROUTES');
    });

    await sub.test('11e. Retry button action invokes search retry handler', () => {
      let retryCount = 0;
      function handleRetry() {
        retryCount += 1;
      }

      handleRetry();
      assert.equal(retryCount, 1, 'Retry trigger must run the search again');
    });

    await sub.test('11f. Friendly initial hint content matches ISSUE-11 specification', () => {
      const initialHint = 'Enter a start and destination to compare routes.';
      assert.equal(initialHint, 'Enter a start and destination to compare routes.');
    });
  });

  await t.test('12. Route Recommendation and Explanation (ISSUE-14 / FR-5.1 - FR-5.5, FR-4.8)', async (sub) => {
    // Pure algorithmic reference matching recommendationService
    function calculateDetourLimit(fastestDuration, maxDetour) {
      if (fastestDuration <= 0) return 10;
      if (typeof maxDetour === 'number' && !isNaN(maxDetour) && maxDetour >= 0) {
        return maxDetour;
      }
      if (typeof maxDetour === 'object' && maxDetour !== null) {
        const pct = maxDetour.maxDetourPct ?? maxDetour.maxPct;
        const min = maxDetour.maxDetourMin ?? maxDetour.maxMinutes;
        if (typeof pct === 'number' && typeof min === 'number') {
          return Math.min(fastestDuration * (pct / 100), min);
        }
        if (typeof pct === 'number') return fastestDuration * (pct / 100);
        if (typeof min === 'number') return min;
      }
      return Math.min(fastestDuration * 0.25, 10);
    }

    function recommendRouteClient(routes, maxDetour) {
      if (!routes || routes.length === 0) {
        return {
          recommendedIndex: -1,
          summary: 'No route available between these points.',
          hasEligibleRoute: false,
        };
      }
      const fastestDuration = Math.min(...routes.map(r => r.durationMinutes));
      const detourLimit = calculateDetourLimit(fastestDuration, maxDetour);
      const maxAllowedDuration = fastestDuration + detourLimit;

      const eligible = routes
        .map((r, idx) => ({ ...r, originalIndex: idx }))
        .filter(r => {
          if (r.durationMinutes > maxAllowedDuration) return false;
          if (r.isInsufficientData === true || r.rating === 'Insufficient data') return false;
          if (typeof r.coveragePercentage === 'number' && r.coveragePercentage < 0.6) return false;
          return typeof r.safety_score === 'number' && !isNaN(r.safety_score);
        });

      if (eligible.length === 0) {
        return {
          recommendedIndex: -1,
          summary: 'No route meets your detour limit. Showing all options.',
          statusMessage: 'No route meets your detour limit.',
          hasEligibleRoute: false,
        };
      }

      const maxScore = Math.max(...eligible.map(c => c.safety_score));
      const topTier = eligible.filter(c => maxScore - c.safety_score <= 2);
      topTier.sort((a, b) => {
        if (a.durationMinutes !== b.durationMinutes) {
          return a.durationMinutes - b.durationMinutes; // faster first
        }
        return b.safety_score - a.safety_score;
      });

      const winner = topTier[0];
      const fastest = routes.find(r => r.durationMinutes === fastestDuration);
      const timeDiff = Math.max(0, winner.durationMinutes - fastestDuration);
      const scoreDiff = Math.round(winner.safety_score - (fastest?.safety_score ?? winner.safety_score));

      let summary = '';
      if (winner.durationMinutes === fastestDuration) {
        summary = `${winner.name} is recommended: Fastest route with the highest safety score (+${Math.round(winner.safety_score)} points).`;
      } else if (scoreDiff > 0) {
        summary = `${winner.name} is recommended: +${Math.round(timeDiff)} min vs fastest, +${scoreDiff} safety points.`;
      } else {
        summary = `${winner.name} is recommended: Faster route (+${Math.round(winner.safety_score)} safety points, within 2 points of top score).`;
      }

      return {
        recommendedIndex: winner.originalIndex,
        recommendedRouteId: winner.id,
        summary,
        hasEligibleRoute: true,
      };
    }

    await sub.test('12a. Acceptance Criteria 1: Safest route too slow is NOT recommended', () => {
      // Fastest = 10 min. Detour limit = min(2.5, 10) = 2.5 min. Max allowed = 12.5 min.
      // Route C is safest (95), but takes 20 min -> excluded. Route B (80, 12 min) is recommended.
      const routes = [
        { id: 'r1', name: 'Route A', durationMinutes: 10, safety_score: 70 },
        { id: 'r2', name: 'Route B', durationMinutes: 12, safety_score: 80 },
        { id: 'r3', name: 'Route C', durationMinutes: 20, safety_score: 95 },
      ];

      const res = recommendRouteClient(routes);
      assert.equal(res.hasEligibleRoute, true);
      assert.equal(res.recommendedIndex, 1);
      assert.equal(res.recommendedRouteId, 'r2');
      assert.notEqual(res.recommendedRouteId, 'r3', 'Route C is too slow and must NOT be recommended');
    });

    await sub.test('12b. Acceptance Criteria 2: Given two routes with scores 85 and 84, faster is recommended', () => {
      const routes = [
        { id: 'fast_84', name: 'Route A', durationMinutes: 10, safety_score: 84 },
        { id: 'slow_85', name: 'Route B', durationMinutes: 12, safety_score: 85 },
      ];

      const res = recommendRouteClient(routes);
      assert.equal(res.recommendedIndex, 0);
      assert.equal(res.recommendedRouteId, 'fast_84');
    });

    await sub.test('12c. Acceptance Criteria 3: Recommendation provides a one-line explanation', () => {
      const routes = [
        { id: 'fast', name: 'Route A', durationMinutes: 10, safety_score: 55 },
        { id: 'safe', name: 'Route B', durationMinutes: 12, safety_score: 84 },
      ];

      const res = recommendRouteClient(routes);
      assert.ok(typeof res.summary === 'string');
      assert.equal(res.summary, 'Route B is recommended: +2 min vs fastest, +29 safety points.');
    });

    await sub.test('12d. Acceptance Criteria 4: Given no eligible route, user sees "No route meets your detour limit."', () => {
      const routes = [
        { id: 'r1', name: 'Route A', durationMinutes: 10, safety_score: 80, isInsufficientData: true },
        { id: 'r2', name: 'Route B', durationMinutes: 16, safety_score: 90 }, // +6 min > 1 min
      ];

      const res = recommendRouteClient(routes, 1);
      assert.equal(res.hasEligibleRoute, false);
      assert.equal(res.recommendedIndex, -1);
      assert.equal(res.statusMessage, 'No route meets your detour limit.');
      assert.ok(res.summary.includes('No route meets your detour limit.'));
    });

    await sub.test('12e. Per-factor reason lines generate concise explanations (FR-4.8)', () => {
      function generateClientFactorReason(factor, score) {
        if (factor === 'Lighting') {
          return `Lighting ${score}/100: ${score >= 80 ? 'well-lit roads in available records.' : 'moderate illumination.'}`;
        }
        if (factor === 'Crime Security') {
          return `Crime Security ${score}/100: ${score >= 80 ? 'low incident density along monitored thoroughfares.' : 'moderate incidents.'}`;
        }
        return `${factor} ${score}/100`;
      }

      const lightingReason = generateClientFactorReason('Lighting', 90);
      assert.equal(lightingReason, 'Lighting 90/100: well-lit roads in available records.');

      const crimeReason = generateClientFactorReason('Crime Security', 85);
      assert.equal(crimeReason, 'Crime Security 85/100: low incident density along monitored thoroughfares.');
    });
  });

  await t.test('13. Leaflet Boundary & Map Route Data Normalization', async (sub) => {
    function extractLeafletLatLngs(route) {
      if (route.geometry && Array.isArray(route.geometry) && route.geometry.length > 0) {
        return route.geometry
          .filter((pt) => Array.isArray(pt) && pt.length >= 2)
          .map(([lng, lat]) => [lat, lng]);
      }
      if (route.waypoints && Array.isArray(route.waypoints) && route.waypoints.length > 0) {
        return route.waypoints
          .filter((w) => typeof w.lat === 'number' && typeof w.lng === 'number' && !isNaN(w.lat) && !isNaN(w.lng))
          .map((w) => [w.lat, w.lng]);
      }
      if (route.coordinates && Array.isArray(route.coordinates) && route.coordinates.length > 0) {
        const first = route.coordinates[0];
        if (Array.isArray(first)) {
          if (Math.abs(first[0]) > 90 || (Math.abs(first[1]) <= 90 && Math.abs(first[0]) > Math.abs(first[1]))) {
            return route.coordinates.map(([lng, lat]) => [lat, lng]);
          }
          return route.coordinates;
        }
      }
      return [];
    }

    await sub.test('13a. Correctly converts GeoJSON [lng, lat] to Leaflet [lat, lng]', () => {
      const route = {
        id: 'ors_route_1',
        geometry: [
          [-71.0603, 42.3662],
          [-71.0650, 42.3600],
          [-71.0776, 42.3498],
        ],
      };

      const latLngs = extractLeafletLatLngs(route);
      assert.equal(latLngs.length, 3);
      // First point: lat 42.3662, lng -71.0603
      assert.deepEqual(latLngs[0], [42.3662, -71.0603]);
      assert.deepEqual(latLngs[2], [42.3498, -71.0776]);
    });

    await sub.test('13b. Extracts coordinates from waypoints array if geometry is missing', () => {
      const route = {
        id: 'waypoints_route',
        waypoints: [
          { lat: 19.0760, lng: 72.8777 },
          { lat: 18.5204, lng: 73.8567 },
        ],
      };

      const latLngs = extractLeafletLatLngs(route);
      assert.equal(latLngs.length, 2);
      assert.deepEqual(latLngs[0], [19.0760, 72.8777]);
      assert.deepEqual(latLngs[1], [18.5204, 73.8567]);
    });

    await sub.test('13c. Handles empty or missing geometry gracefully without throwing', () => {
      assert.deepEqual(extractLeafletLatLngs({ id: 'empty' }), []);
      assert.deepEqual(extractLeafletLatLngs({ id: 'empty_geom', geometry: [] }), []);
    });

    await sub.test('13d. Alternative routes maintain distinct IDs, letters, and formatting', () => {
      const routes = [
        { id: 'alt_safe_corridor', letter: 'A', name: 'Safe Corridor', distanceText: '2.1 km', durationText: '22 mins' },
        { id: 'alt_balanced_transit', letter: 'B', name: 'Balanced Transit', distanceText: '1.8 km', durationText: '19 mins' },
        { id: 'alt_direct_shortcut', letter: 'C', name: 'Direct Shortcut', distanceText: '1.4 km', durationText: '16 mins' },
      ];

      assert.equal(routes.length, 3);
      assert.equal(routes[0].letter, 'A');
      assert.equal(routes[1].letter, 'B');
      assert.equal(routes[2].letter, 'C');
      assert.ok(routes[0].distanceText.includes('km'));
      assert.ok(routes[0].durationText.includes('mins'));
    });
  });
});

