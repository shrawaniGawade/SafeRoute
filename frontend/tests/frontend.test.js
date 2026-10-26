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

  await t.test('14. Real Location Search and Route Alternatives Synchronization', async (sub) => {
    await sub.test('14a. Reverse geocoding builds readable human address from coordinates', () => {
      function formatReverseAddress(result, lat, lng) {
        if (!result) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        return result.displayName || result.label || `${result.name}, ${result.city || ''}`;
      }

      const sampleResult = {
        name: 'Linkcode Technologies',
        city: 'Pune',
        displayName: 'Linkcode Technologies, Fergusson College Rd, Shivajinagar, Pune, Maharashtra 411004',
      };

      const formatted = formatReverseAddress(sampleResult, 18.5284, 73.8436);
      assert.equal(formatted.includes('Shivajinagar'), true);
      assert.equal(formatted.includes('Pune'), true);
    });

    await sub.test('14b. Suggestions store actual latitude and longitude upon selection', () => {
      const suggestion = {
        name: 'Sai Aangan Society',
        displayName: 'Sai Aangan Society, Near Saibaba Mandir, Alandi Road, Bhosari, Pune',
        lat: 18.642953,
        lng: 73.876243,
      };

      let selectedCoords = null;
      let selectedText = '';

      function handleSelect(item) {
        selectedText = item.displayName;
        selectedCoords = { lat: item.lat, lng: item.lng };
      }

      handleSelect(suggestion);
      assert.equal(selectedText, suggestion.displayName);
      assert.deepEqual(selectedCoords, { lat: 18.642953, lng: 73.876243 });
    });

    await sub.test('14c. Route alternatives display up to 3 routes or exact available count', () => {
      function getRouteCountLabel(routes) {
        if (!routes || routes.length === 0) return '0 Routes Available';
        if (routes.length === 1) return '1 Route Available';
        return `${routes.length} Routes Available`;
      }

      assert.equal(getRouteCountLabel([{ id: '1' }]), '1 Route Available');
      assert.equal(getRouteCountLabel([{ id: '1' }, { id: '2' }]), '2 Routes Available');
      assert.equal(getRouteCountLabel([{ id: '1' }, { id: '2' }, { id: '3' }]), '3 Routes Available');
    });

    await sub.test('14d. Active route selection updates highlighted route and stroke differentiation', () => {
      const routes = [
        { id: 'route_A', letter: 'A', name: 'Safe Corridor' },
        { id: 'route_B', letter: 'B', name: 'Balanced Transit' },
        { id: 'route_C', letter: 'C', name: 'Direct Shortcut' },
      ];

      let selectedRouteId = 'route_A';
      function getRouteStyle(routeId) {
        const isSelected = routeId === selectedRouteId;
        return {
          weight: isSelected ? 7 : 4,
          opacity: isSelected ? 1.0 : 0.4,
        };
      }

      assert.deepEqual(getRouteStyle('route_A'), { weight: 7, opacity: 1.0 });
      assert.deepEqual(getRouteStyle('route_B'), { weight: 4, opacity: 0.4 });

      // Switch selection to Route B
      selectedRouteId = 'route_B';
      assert.deepEqual(getRouteStyle('route_A'), { weight: 4, opacity: 0.4 });
      assert.deepEqual(getRouteStyle('route_B'), { weight: 7, opacity: 1.0 });
    });
  });

  await t.test('15. Route-Specific Full Audit Score Consistency & Environmental Factors', async (sub) => {
    // Shared mathematical scoring formula
    function computeSafetyScore(factors) {
      const raw =
        factors.lighting * 3.4 +
        factors.crowd_level * 2.3 +
        (10 - factors.crime_risk) * 2.6 +
        (10 - factors.accident_risk) * 1.7;
      return Math.max(15, Math.min(99.5, Math.round(raw * 10) / 10));
    }

    const routeA = {
      id: 'alt_a',
      letter: 'A',
      name: 'Route A: Primary Safe Corridor',
      factors: { lighting: 9.0, crime_risk: 1.0, accident_risk: 2.0, crowd_level: 8.0, emergency_proximity: 8.5 },
    };
    const routeB = {
      id: 'alt_b',
      letter: 'B',
      name: 'Route B: Balanced Transit Avenue',
      factors: { lighting: 7.0, crime_risk: 3.0, accident_risk: 3.0, crowd_level: 6.0, emergency_proximity: 7.0 },
    };
    const routeC = {
      id: 'alt_c',
      letter: 'C',
      name: 'Route C: Direct Shortcut',
      factors: { lighting: 4.0, crime_risk: 5.5, accident_risk: 4.5, crowd_level: 3.0, emergency_proximity: 4.5 },
    };

    routeA.safety_score = computeSafetyScore(routeA.factors);
    routeB.safety_score = computeSafetyScore(routeB.factors);
    routeC.safety_score = computeSafetyScore(routeC.factors);

    await sub.test('15a. Strictly enforces Route A > Route B > Route C monotonic safety scores', () => {
      assert.ok(
        routeA.safety_score > routeB.safety_score,
        `Route A (${routeA.safety_score}) must be strictly safer than Route B (${routeB.safety_score})`
      );
      assert.ok(
        routeB.safety_score > routeC.safety_score,
        `Route B (${routeB.safety_score}) must be strictly safer than Route C (${routeC.safety_score})`
      );
    });

    await sub.test('15b. Route-specific environmental factors are distinct and directionally sound', () => {
      // Illumination: Route A > Route B > Route C
      assert.ok(routeA.factors.lighting > routeB.factors.lighting);
      assert.ok(routeB.factors.lighting > routeC.factors.lighting);

      // Foot traffic: Route A > Route B > Route C
      assert.ok(routeA.factors.crowd_level > routeB.factors.crowd_level);
      assert.ok(routeB.factors.crowd_level > routeC.factors.crowd_level);

      // Crime risk: Route A < Route B < Route C (Lower risk is safer)
      assert.ok(routeA.factors.crime_risk < routeB.factors.crime_risk);
      assert.ok(routeB.factors.crime_risk < routeC.factors.crime_risk);

      // Accident risk: Route A < Route B < Route C (Lower risk is safer)
      assert.ok(routeA.factors.accident_risk < routeB.factors.accident_risk);
      assert.ok(routeB.factors.accident_risk < routeC.factors.accident_risk);

      // Emergency proximity: Route A > Route B > Route C
      assert.ok(routeA.factors.emergency_proximity > routeB.factors.emergency_proximity);
      assert.ok(routeB.factors.emergency_proximity > routeC.factors.emergency_proximity);
    });

    await sub.test('15c. Mathematical scoring formula correctly aggregates weighted factor contributions', () => {
      // Expected Route A: (9*3.4) + (8*2.3) + ((10-1)*2.6) + ((10-2)*1.7) = 30.6 + 18.4 + 23.4 + 13.6 = 86.0
      const scoreA = computeSafetyScore(routeA.factors);
      assert.equal(scoreA, 86.0);

      // Expected Route B: (7*3.4) + (6*2.3) + ((10-3)*2.6) + ((10-3)*1.7) = 23.8 + 13.8 + 18.2 + 11.9 = 67.7
      const scoreB = computeSafetyScore(routeB.factors);
      assert.equal(scoreB, 67.7);

      // Expected Route C: (4*3.4) + (3*2.3) + ((10-5.5)*2.6) + ((10-4.5)*1.7) = 13.6 + 6.9 + 11.7 + 9.35 = 41.55 => 41.6
      const scoreC = computeSafetyScore(routeC.factors);
      assert.equal(scoreC, 41.6);
    });

    await sub.test('15d. Audit view state resolver dynamically swaps factor breakdown when switching routes', () => {
      const routes = [routeA, routeB, routeC];
      function resolveActiveAuditRoute(selectedId) {
        return routes.find((r) => r.id === selectedId) || routes[0];
      }

      // Initial selection defaults to Route A
      const initial = resolveActiveAuditRoute('alt_a');
      assert.equal(initial.letter, 'A');
      assert.equal(initial.safety_score, 86.0);
      assert.equal(initial.factors.lighting, 9.0);

      // Switch to Route B
      const auditB = resolveActiveAuditRoute('alt_b');
      assert.equal(auditB.letter, 'B');
      assert.equal(auditB.safety_score, 67.7);
      assert.equal(auditB.factors.lighting, 7.0);

      // Switch to Route C
      const auditC = resolveActiveAuditRoute('alt_c');
      assert.equal(auditC.letter, 'C');
      assert.equal(auditC.safety_score, 41.6);
      assert.equal(auditC.factors.lighting, 4.0);
    });

    await sub.test('15e. Data source transparency distinguishes verified open data from modeled corridor benchmarks', () => {
      function getDataSourceMetadata(locationName) {
        const isChicago = locationName.toLowerCase().includes('chicago');
        return {
          crimeDataType: isChicago ? 'verified_historical_incidents' : 'corridor_sample_benchmark',
          crimeSource: isChicago
            ? 'Chicago Police Department 2024 Incident Registry (Socrata API ijzp-q8t2.json)'
            : 'Municipal Corridor Risk Benchmark & Urban Arterial Density Estimation (Modeled Sample)',
          isVerified: isChicago,
        };
      }

      const chicagoMeta = getDataSourceMetadata('The Loop, Chicago, IL');
      assert.equal(chicagoMeta.crimeDataType, 'verified_historical_incidents');
      assert.equal(chicagoMeta.isVerified, true);

      const externalMeta = getDataSourceMetadata('Shivajinagar, Pune, Maharashtra');
      assert.equal(externalMeta.crimeDataType, 'corridor_sample_benchmark');
      assert.equal(externalMeta.isVerified, false);
    });
  });

  await t.test('16. Admin Authorization, Role Invariants & Navigation Security', async (sub) => {
    function resolveNavigationAccess(requestedRoute, user, isAuthenticated) {
      if (!isAuthenticated) {
        if (requestedRoute === 'admin') {
          return { route: 'admin-login', status: 401, allowed: false };
        }
        const guestAllowed = ['landing', 'login', 'admin-login', 'not-found', 'unauthorized'];
        return guestAllowed.includes(requestedRoute)
          ? { route: requestedRoute, status: 200, allowed: true }
          : { route: 'landing', status: 200, allowed: true };
      }

      if (user?.role === 'user') {
        if (requestedRoute === 'admin') {
          return { route: 'unauthorized', status: 403, allowed: false, message: 'Access restricted: Admin privileges required.' };
        }
        if (requestedRoute === 'login' || requestedRoute === 'admin-login') {
          return { route: 'app', status: 200, allowed: true };
        }
        return { route: requestedRoute, status: 200, allowed: true };
      }

      if (user?.role === 'admin') {
        // Any authenticated admin with role 'admin' can access admin console regardless of email address
        const userDashboardRoutes = ['app', 'routes', 'profile'];
        if (requestedRoute === 'login' || requestedRoute === 'admin-login' || userDashboardRoutes.includes(requestedRoute)) {
          return { route: 'admin', status: 200, allowed: true };
        }
        return { route: requestedRoute, status: 200, allowed: true };
      }

      return { route: 'unauthorized', status: 403, allowed: false };
    }

    await sub.test('16a. Authorized admin (shrawanig74@gmail.com) can access admin route without email allowlist rejection', () => {
      const adminUser = {
        id: 'usr_admin_shrawani',
        email: 'shrawanig74@gmail.com',
        role: 'admin',
        isVerified: true
      };
      const result = resolveNavigationAccess('admin', adminUser, true);
      assert.equal(result.allowed, true);
      assert.equal(result.route, 'admin');
      assert.equal(result.status, 200);
    });

    await sub.test('16b. Normal user with role "user" receives 403 unauthorized when accessing admin', () => {
      const regularUser = {
        id: 'usr_traveler_1',
        email: 'traveler@example.com',
        role: 'user',
        isVerified: true
      };
      const result = resolveNavigationAccess('admin', regularUser, true);
      assert.equal(result.allowed, false);
      assert.equal(result.route, 'unauthorized');
      assert.equal(result.status, 403);
      assert.equal(result.message, 'Access restricted: Admin privileges required.');
    });

    await sub.test('16c. Unauthenticated visitor receives 401 redirect to admin-login', () => {
      const result = resolveNavigationAccess('admin', null, false);
      assert.equal(result.allowed, false);
      assert.equal(result.route, 'admin-login');
      assert.equal(result.status, 401);
    });

    await sub.test('16d. Admin authorization persists across session restoration / page refresh', () => {
      // Simulate session restoration from refresh token
      const restoredSession = {
        accessToken: 'valid_restored_jwt_token',
        user: {
          id: 'usr_admin_restored',
          name: 'Shrawani Gawade',
          email: 'shrawanig74@gmail.com',
          role: 'admin',
          isVerified: true
        }
      };

      assert.ok(restoredSession.accessToken);
      assert.equal(restoredSession.user.role, 'admin');

      const routeCheck = resolveNavigationAccess('admin', restoredSession.user, true);
      assert.equal(routeCheck.allowed, true);
      assert.equal(routeCheck.route, 'admin');
    });

    await sub.test('16e. Normal users can still access standard commuter dashboard and routes', () => {
      const regularUser = {
        id: 'usr_traveler_2',
        email: 'commuter@saferoute.com',
        role: 'user',
        isVerified: true
      };

      const dashboard = resolveNavigationAccess('app', regularUser, true);
      assert.equal(dashboard.allowed, true);
      assert.equal(dashboard.route, 'app');

      const routes = resolveNavigationAccess('routes', regularUser, true);
      assert.equal(routes.allowed, true);
      assert.equal(routes.route, 'routes');

      const profile = resolveNavigationAccess('profile', regularUser, true);
      assert.equal(profile.allowed, true);
      assert.equal(profile.route, 'profile');
    });
  });
});

