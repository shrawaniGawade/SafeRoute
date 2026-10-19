/**
 * SafeRoute Route Recommendation & Explanation Engine (ISSUE-14 / FR-5.1 - FR-5.5, FR-4.8 · FRD F3.3, F3.4)
 *
 * Algorithm Workflow:
 * 1. Find the fastest route's duration (ETA in minutes).
 * 2. Calculate maximum allowable detour:
 *    - Default: Smaller of +25% of fastest ETA or +10 minutes (guest default)
 *    - Custom: User's maxDetour preferences (minutes or percentage)
 * 3. Filter out routes that exceed the maximum allowable duration.
 * 4. Filter out routes with "Insufficient data" or coverage < 60%.
 * 5. Rank remaining eligible routes by Safety Score.
 * 6. Tie-breaking rule: If two scores are within 2 points (Math.abs(scoreA - scoreB) <= 2),
 *    recommend the faster route (shorter ETA).
 * 7. Generate a one-line summary explanation (e.g. "Route B is recommended: +2 min vs fastest, +29 safety points.")
 * 8. Generate one-line explanations for each safety factor (e.g. "Lighting 90/100: well-lit roads in available records.")
 * 9. If no route qualifies, return status: "No route meets your detour limit. Showing all options."
 */

export interface RouteInputForRecommendation {
  id: string;
  name?: string;
  letter?: string;
  durationMinutes?: number | null;
  durationText?: string;
  distanceKm?: number | null;
  distanceText?: string;
  safety_score?: number | null;
  score?: number | null;
  risk_level?: string;
  rating?: string;
  isRecommended?: boolean;
  isNavigable?: boolean;
  isInsufficientData?: boolean;
  coveragePercentage?: number;
  factors?: {
    lighting?: number;
    crime?: number;
    crime_risk?: number;
    accident?: number;
    accident_risk?: number;
    activity?: number;
    crowd_level?: number;
    emergencyNearby?: number;
    emergency_proximity?: number;
    timeOfDay?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface MaxDetourOptions {
  maxDetourPct?: number; // e.g. 25 (%)
  maxDetourMin?: number; // e.g. 10 (minutes)
  maxPct?: number;
  maxMinutes?: number;
}

export type MaxDetourInput = number | MaxDetourOptions | undefined | null;

export interface FactorReasonItem {
  factor: string;
  score: number;
  reason: string;
}

export interface RecommendationExplanation {
  summary: string;
  factorReasons: FactorReasonItem[];
  disclaimer: string;
}

export interface RouteRecommendationResult<T = RouteInputForRecommendation> {
  recommendedIndex: number; // 0-based index or -1 if none eligible
  recommendedRouteId: string | null;
  recommendedRoute: T | null;
  hasEligibleRoute: boolean;
  statusMessage?: string;
  explanation: RecommendationExplanation;
  metadata: {
    fastestDurationMinutes: number;
    detourLimitMinutes: number;
    maxAllowedDurationMinutes: number;
    eligibleCount: number;
    totalCount: number;
  };
  routes: Array<T & { isRecommended: boolean; recommendationReason?: string }>;
}

export const DISCLAIMER_TEXT =
  'Scores reflect available data only and do not guarantee safety.';

/**
 * Extracts duration in minutes from various representation types
 */
export function getDurationMinutes(route: RouteInputForRecommendation): number {
  if (typeof route.durationMinutes === 'number' && !isNaN(route.durationMinutes)) {
    return route.durationMinutes;
  }
  if (typeof route.duration === 'number' && !isNaN(route.duration)) {
    return route.duration > 120 ? Math.round(route.duration / 60) : route.duration;
  }
  if (typeof route.durationText === 'string') {
    const match = route.durationText.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const val = parseFloat(match[1]);
      if (
        route.durationText.toLowerCase().includes('hour') ||
        route.durationText.toLowerCase().includes('hr')
      ) {
        return Math.round(val * 60);
      }
      return Math.round(val);
    }
  }
  return 0;
}

/**
 * Extracts safety score (0-100) from route
 */
export function getSafetyScore(route: RouteInputForRecommendation): number | null {
  if (typeof route.safety_score === 'number' && !isNaN(route.safety_score)) {
    return route.safety_score;
  }
  if (typeof route.score === 'number' && !isNaN(route.score)) {
    return route.score;
  }
  return null;
}

/**
 * Checks whether a route has insufficient data
 */
export function isInsufficientData(route: RouteInputForRecommendation): boolean {
  if (route.isInsufficientData === true) return true;
  if (
    typeof route.risk_level === 'string' &&
    route.risk_level.toLowerCase().includes('insufficient')
  ) {
    return true;
  }
  if (
    typeof route.rating === 'string' &&
    route.rating.toLowerCase().includes('insufficient')
  ) {
    return true;
  }
  if (typeof route.coveragePercentage === 'number' && route.coveragePercentage < 0.6) {
    return true;
  }
  const score = getSafetyScore(route);
  if (score === null || isNaN(score)) return true;
  return false;
}

/**
 * Generates one-line reasons for each factor (FR-4.8)
 */
export function generateFactorReasons(
  factors?: Record<string, any>
): FactorReasonItem[] {
  if (!factors) return [];

  const items: FactorReasonItem[] = [];

  // Helper to normalize factor values from 0-10 to 0-100 if needed
  const normalize = (val?: number): number => {
    if (typeof val !== 'number' || isNaN(val)) return 75;
    return val <= 10 ? Math.round(val * 10) : Math.round(val);
  };

  // 1. Streetlighting
  const lightingVal = factors.lighting;
  if (lightingVal !== undefined) {
    const sc = normalize(lightingVal);
    const reason =
      sc >= 80
        ? 'well-lit roads in available records.'
        : sc >= 50
        ? 'moderate illumination along secondary streets.'
        : 'limited lighting with intermittent dark zones.';
    items.push({ factor: 'Lighting', score: sc, reason: `Lighting ${sc}/100: ${reason}` });
  }

  // 2. Crime Risk / Security
  const crimeVal = factors.crime !== undefined ? factors.crime : factors.crime_risk;
  if (crimeVal !== undefined) {
    // If crime_risk is 0-10 (where 1 is safe), security score is (10 - crime_risk)*10
    const sc =
      factors.crime !== undefined
        ? normalize(factors.crime)
        : Math.max(0, Math.min(100, Math.round((10 - crimeVal) * 10)));
    const reason =
      sc >= 80
        ? 'low incident density along monitored thoroughfares.'
        : sc >= 50
        ? 'moderate historical incidents; stay on primary avenues.'
        : 'elevated historical crime records in this corridor.';
    items.push({ factor: 'Crime Security', score: sc, reason: `Crime Security ${sc}/100: ${reason}` });
  }

  // 3. Traffic / Accident Risk
  const accidentVal = factors.accident !== undefined ? factors.accident : factors.accident_risk;
  if (accidentVal !== undefined) {
    const sc =
      factors.accident !== undefined
        ? normalize(factors.accident)
        : Math.max(0, Math.min(100, Math.round((10 - accidentVal) * 10)));
    const reason =
      sc >= 80
        ? 'minimal pedestrian and vehicular collision hotspots.'
        : sc >= 50
        ? 'moderate traffic intersections with standard crosswalks.'
        : 'busy intersections with higher historical incident rates.';
    items.push({ factor: 'Traffic Safety', score: sc, reason: `Traffic Safety ${sc}/100: ${reason}` });
  }

  // 4. Pedestrian Activity / Crowd Level
  const activityVal = factors.activity !== undefined ? factors.activity : factors.crowd_level;
  if (activityVal !== undefined) {
    const sc = normalize(activityVal);
    const reason =
      sc >= 80
        ? 'active bystander presence and vibrant foot traffic.'
        : sc >= 50
        ? 'steady daytime foot traffic with quieter evening segments.'
        : 'isolated corridors with low foot traffic density.';
    items.push({ factor: 'Pedestrian Activity', score: sc, reason: `Pedestrian Activity ${sc}/100: ${reason}` });
  }

  // 5. Emergency Proximity
  const emergVal =
    factors.emergencyNearby !== undefined ? factors.emergencyNearby : factors.emergency_proximity;
  if (emergVal !== undefined) {
    const sc = normalize(emergVal);
    const reason =
      sc >= 80
        ? 'rapid emergency dispatch coverage within 500m.'
        : sc >= 50
        ? 'municipal police or medical facilities within 1.5km.'
        : 'extended distance from nearest emergency dispatch hubs.';
    items.push({ factor: 'Emergency Proximity', score: sc, reason: `Emergency Proximity ${sc}/100: ${reason}` });
  }

  // 6. Time of Day
  if (factors.timeOfDay !== undefined) {
    const sc = normalize(factors.timeOfDay);
    const reason =
      sc >= 80
        ? 'daylight travel with optimal natural visibility.'
        : sc >= 50
        ? 'evening departure with transitional street lighting.'
        : 'late night hours requiring heightened personal vigilance.';
    items.push({ factor: 'Time of Day', score: sc, reason: `Time of Day ${sc}/100: ${reason}` });
  }

  return items;
}

/**
 * Calculates allowable detour in minutes based on fastest duration and optional user preference
 */
export function calculateDetourLimit(
  fastestDuration: number,
  maxDetour?: MaxDetourInput
): number {
  if (fastestDuration <= 0) return 10;

  // Custom number in minutes (e.g. 5, 10, 15)
  if (typeof maxDetour === 'number' && !isNaN(maxDetour) && maxDetour >= 0) {
    return maxDetour;
  }

  // Object preferences (e.g. { maxDetourPct: 15, maxDetourMin: 8 })
  if (typeof maxDetour === 'object' && maxDetour !== null) {
    const pct = maxDetour.maxDetourPct ?? maxDetour.maxPct;
    const min = maxDetour.maxDetourMin ?? maxDetour.maxMinutes;

    if (typeof pct === 'number' && typeof min === 'number') {
      const pctMinutes = fastestDuration * (pct / 100);
      return Math.min(pctMinutes, min);
    }
    if (typeof pct === 'number') {
      return fastestDuration * (pct / 100);
    }
    if (typeof min === 'number') {
      return min;
    }
  }

  // Default guest setting: Smaller of +25% or +10 minutes
  const defaultPctMin = fastestDuration * 0.25;
  return Math.min(defaultPctMin, 10);
}

/**
 * Core Route Recommendation Function (ISSUE-14 / FR-5.1 - FR-5.5)
 */
export function recommendRoute<T extends RouteInputForRecommendation>(
  routes: T[],
  maxDetour?: MaxDetourInput
): RouteRecommendationResult<T> {
  if (!routes || routes.length === 0) {
    return {
      recommendedIndex: -1,
      recommendedRouteId: null,
      recommendedRoute: null,
      hasEligibleRoute: false,
      statusMessage: 'No route available between these points.',
      explanation: {
        summary: 'No route available between these points.',
        factorReasons: [],
        disclaimer: DISCLAIMER_TEXT,
      },
      metadata: {
        fastestDurationMinutes: 0,
        detourLimitMinutes: 0,
        maxAllowedDurationMinutes: 0,
        eligibleCount: 0,
        totalCount: 0,
      },
      routes: [],
    };
  }

  // 1. Find the fastest route's duration
  const durations = routes.map((r) => getDurationMinutes(r));
  const validDurations = durations.filter((d) => d > 0);
  const fastestDuration = validDurations.length > 0 ? Math.min(...validDurations) : 0;

  // Find index of fastest route
  const fastestIndex = routes.findIndex((r) => getDurationMinutes(r) === fastestDuration);
  const fastestRoute = routes[fastestIndex >= 0 ? fastestIndex : 0];

  // 2. Calculate maximum allowable detour
  const detourLimit = calculateDetourLimit(fastestDuration, maxDetour);
  const maxAllowedDuration = fastestDuration + detourLimit;

  // 3 & 4. Filter routes by detour limit and data sufficiency
  interface EvaluatedCandidate {
    route: T;
    originalIndex: number;
    duration: number;
    score: number;
  }

  const eligibleCandidates: EvaluatedCandidate[] = [];

  routes.forEach((route, originalIndex) => {
    const duration = getDurationMinutes(route);
    const score = getSafetyScore(route);

    // Rule 1: Slower than fastest by more than detour limit -> Exclude (FR-5.1)
    if (fastestDuration > 0 && duration > maxAllowedDuration) {
      return;
    }

    // Rule 2: Insufficient data -> Exclude (FR-5.2)
    if (isInsufficientData(route) || score === null) {
      return;
    }

    eligibleCandidates.push({
      route,
      originalIndex,
      duration,
      score,
    });
  });

  // 5. Handle case where no route meets criteria (FR-5.5 / AC: "Given no eligible route, then I see 'No route meets your detour limit.'")
  if (eligibleCandidates.length === 0) {
    const noEligibleMessage = 'No route meets your detour limit. Showing all options.';
    const updatedRoutes = routes.map((r) => ({
      ...r,
      isRecommended: false,
      recommendationReason: undefined,
    }));

    return {
      recommendedIndex: -1,
      recommendedRouteId: null,
      recommendedRoute: null,
      hasEligibleRoute: false,
      statusMessage: 'No route meets your detour limit.',
      explanation: {
        summary: noEligibleMessage,
        factorReasons: [],
        disclaimer: DISCLAIMER_TEXT,
      },
      metadata: {
        fastestDurationMinutes: fastestDuration,
        detourLimitMinutes: Math.round(detourLimit * 10) / 10,
        maxAllowedDurationMinutes: Math.round(maxAllowedDuration * 10) / 10,
        eligibleCount: 0,
        totalCount: routes.length,
      },
      routes: updatedRoutes,
    };
  }

  // 6. Pick highest score with tie-break rule (FR-5.3)
  // Find top score among eligible candidates
  const maxScore = Math.max(...eligibleCandidates.map((c) => c.score));

  // "If two scores are within 2 points, pick the faster route"
  const topTierCandidates = eligibleCandidates.filter((c) => maxScore - c.score <= 2);

  // Sort top-tier candidates by duration ascending (faster first), then higher score
  topTierCandidates.sort((a, b) => {
    if (a.duration !== b.duration) {
      return a.duration - b.duration; // shorter ETA wins
    }
    return b.score - a.score; // higher score wins
  });

  const winner = topTierCandidates[0];
  const recommendedRoute = winner.route;
  const recommendedIndex = winner.originalIndex;
  const winnerLetter =
    recommendedRoute.letter ||
    (['A', 'B', 'C', 'D', 'E'][recommendedIndex] ?? String(recommendedIndex + 1));
  const winnerName = recommendedRoute.name || `Route ${winnerLetter}`;

  // 7. Generate Summary Line (FR-5.4 / FRD F3.4)
  const timeDiff = Math.max(0, winner.duration - fastestDuration);
  const fastestScore = getSafetyScore(fastestRoute) ?? winner.score;
  const scoreDiff = Math.round(winner.score - fastestScore);

  let summaryLine = '';
  let reasonText = '';

  const isFastest = winner.originalIndex === fastestIndex || timeDiff === 0;

  if (isFastest) {
    summaryLine = `${winnerName} is recommended: Fastest route with the highest safety score (+${Math.round(winner.score)} points).`;
    reasonText = `Fastest route with optimal safety score (${Math.round(winner.score)}/100).`;
  } else if (scoreDiff > 0) {
    // Exact requested format in FRD F3.4: "Route B is recommended: +2 min vs fastest, +29 safety points."
    summaryLine = `${winnerName} is recommended: +${Math.round(timeDiff)} min vs fastest, +${scoreDiff} safety points.`;
    reasonText = `+${Math.round(timeDiff)} min vs fastest, +${scoreDiff} safety points.`;
  } else if (maxScore - winner.score <= 2 && topTierCandidates.length > 1) {
    summaryLine = `${winnerName} is recommended: Faster route (+${Math.round(winner.score)} safety points, within 2 points of top score).`;
    reasonText = `Faster route within 2 points of top safety score (${Math.round(winner.score)}/100).`;
  } else {
    summaryLine = `${winnerName} is recommended: +${Math.round(timeDiff)} min vs fastest, optimal safety balance (${Math.round(winner.score)}/100).`;
    reasonText = `+${Math.round(timeDiff)} min vs fastest, balanced safety score (${Math.round(winner.score)}/100).`;
  }

  // 8. Generate Per-Factor Reasons (FR-4.8)
  const factorReasons = generateFactorReasons(recommendedRoute.factors);

  // 9. Update routes array with isRecommended flag and reason
  const updatedRoutes = routes.map((r, idx) => ({
    ...r,
    isRecommended: idx === recommendedIndex,
    recommendationReason: idx === recommendedIndex ? reasonText : undefined,
  }));

  return {
    recommendedIndex,
    recommendedRouteId: recommendedRoute.id,
    recommendedRoute,
    hasEligibleRoute: true,
    statusMessage: summaryLine,
    explanation: {
      summary: summaryLine,
      factorReasons,
      disclaimer: DISCLAIMER_TEXT,
    },
    metadata: {
      fastestDurationMinutes: fastestDuration,
      detourLimitMinutes: Math.round(detourLimit * 10) / 10,
      maxAllowedDurationMinutes: Math.round(maxAllowedDuration * 10) / 10,
      eligibleCount: eligibleCandidates.length,
      totalCount: routes.length,
    },
    routes: updatedRoutes,
  };
}
