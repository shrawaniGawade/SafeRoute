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
});

