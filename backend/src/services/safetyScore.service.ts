import turfAlong from '@turf/along';
import turfLength from '@turf/length';
import { lineString } from '@turf/helpers';
import { SafetyRecord } from '../models/SafetyRecord';
import { EmergencyLocation } from '../models/EmergencyLocation';

// Robust ESM/CommonJS interop wrappers for Turf functions
const along: typeof turfAlong = (turfAlong as any).default || turfAlong;
const length: typeof turfLength = (turfLength as any).default || turfLength;

/**
 * Standard SafeRoute 6-Factor Safety Weights
 * lighting: 25%, crime: 25%, accident: 20%, activity: 10%, timeOfDay: 10%, emergencyNearby: 10%
 * Total: 100% (1.0)
 */
export interface FactorWeights {
  lighting: number;
  crime: number;
  accident: number;
  activity: number;
  timeOfDay: number;
  emergencyNearby: number;
}

export const DEFAULT_FACTOR_WEIGHTS: Readonly<FactorWeights> = Object.freeze({
  lighting: 0.25,
  crime: 0.25,
  accident: 0.2,
  activity: 0.1,
  timeOfDay: 0.1,
  emergencyNearby: 0.1,
});

export type FactorKey = keyof FactorWeights;

export const ALL_FACTOR_KEYS: ReadonlyArray<FactorKey> = Object.freeze([
  'lighting',
  'crime',
  'accident',
  'activity',
  'timeOfDay',
  'emergencyNearby',
]);

export interface FactorScoresInput {
  lighting?: number | null;
  crime?: number | null;
  accident?: number | null;
  activity?: number | null;
  timeOfDay?: number | null;
  emergencyNearby?: number | null;
}

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Insufficient data';
export type TimePeriod = 'day' | 'evening' | 'night';

export interface FactorDetail {
  factor: FactorKey;
  score: number | null;
  rawScore: number | null;
  weight: number;
  effectiveWeight: number;
  weightedScore: number | null;
  isKnown: boolean;
  status: 'known' | 'unknown';
}

export interface SafetyScoreComputation {
  score: number | null;
  displayScore: string;
  riskLevel: RiskLevel;
  hasSufficientData: boolean;
  status: 'sufficient' | 'Insufficient data';
  coveragePercentage: number;
  factors: Record<FactorKey, FactorDetail>;
  weightsTotal: number;
  dataFreshness?: string;
  metadata?: Record<string, any>;
}

export interface RouteEvaluationOptions {
  coordinates?: Array<[number, number]>; // [longitude, latitude]
  departureTime?: string | Date | number;
  customFactors?: Partial<FactorScoresInput>;
  customWeights?: Partial<FactorWeights>;
  coverageThreshold?: number; // Default 0.60 (60%)
  sampleIntervalMeters?: number; // Default 200 meters
  searchRadiusMeters?: number; // Default 250 meters
}

export interface SamplePointData {
  coordinates: [number, number]; // [lon, lat]
  distanceAlongKm: number;
  hasData: boolean;
  safetyRecordsCount: number;
  emergencyLocationsCount: number;
  nearestEmergencyDistanceMeters?: number;
}

export interface RouteSafetyEvaluationResult extends SafetyScoreComputation {
  totalDistanceKm: number;
  samplePointsCount: number;
  samplePointsWithDataCount: number;
  samplePoints: SamplePointData[];
}

/**
 * Determines the time factor score based on departure time rules:
 * - day: 100 (06:00 - 18:00)
 * - evening: 70 (18:00 - 22:00)
 * - night: 40 (22:00 - 06:00)
 */
export function getTimeFactorScore(timeInput?: string | Date | number): {
  score: number;
  period: TimePeriod;
  description: string;
} {
  if (timeInput === undefined || timeInput === null) {
    return { score: 100, period: 'day', description: 'Daylight departure (default)' };
  }

  // Handle explicit keywords
  if (typeof timeInput === 'string') {
    const lower = timeInput.toLowerCase().trim();
    if (lower === 'day' || lower === 'daylight' || lower === 'morning' || lower === 'afternoon') {
      return { score: 100, period: 'day', description: 'Daylight departure (optimal natural illumination)' };
    }
    if (lower === 'evening' || lower === 'dusk' || lower === 'twilight') {
      return { score: 70, period: 'evening', description: 'Evening departure (transitional lighting)' };
    }
    if (lower === 'night' || lower === 'dark' || lower === 'late_night' || lower === 'midnight') {
      return { score: 40, period: 'night', description: 'Night departure (elevated caution, reduced natural visibility)' };
    }
  }

  // Parse hours from number, Date, or time string (e.g. "23:30", "2024-03-27T22:30:00Z")
  let hour = 12; // default midday
  if (typeof timeInput === 'number') {
    hour = Math.floor(timeInput) % 24;
  } else if (timeInput instanceof Date) {
    hour = timeInput.getHours();
  } else if (typeof timeInput === 'string') {
    const parsedDate = new Date(timeInput);
    if (!isNaN(parsedDate.getTime())) {
      hour = parsedDate.getHours();
    } else {
      const match = timeInput.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        hour = parseInt(match[1], 10) % 24;
      }
    }
  }

  // Day: 06:00 - 17:59
  if (hour >= 6 && hour < 18) {
    return { score: 100, period: 'day', description: `Daytime departure at ${hour}:00` };
  }
  // Evening: 18:00 - 21:59
  if (hour >= 18 && hour < 22) {
    return { score: 70, period: 'evening', description: `Evening departure at ${hour}:00` };
  }
  // Night: 22:00 - 05:59
  return { score: 40, period: 'night', description: `Nighttime departure at ${hour}:00` };
}

/**
 * Validates and normalizes weights so that they always total 100% (1.0).
 */
export function normalizeWeights(weights?: Partial<FactorWeights>): FactorWeights {
  const base = {
    lighting: weights?.lighting ?? DEFAULT_FACTOR_WEIGHTS.lighting,
    crime: weights?.crime ?? DEFAULT_FACTOR_WEIGHTS.crime,
    accident: weights?.accident ?? DEFAULT_FACTOR_WEIGHTS.accident,
    activity: weights?.activity ?? DEFAULT_FACTOR_WEIGHTS.activity,
    timeOfDay: weights?.timeOfDay ?? DEFAULT_FACTOR_WEIGHTS.timeOfDay,
    emergencyNearby: weights?.emergencyNearby ?? DEFAULT_FACTOR_WEIGHTS.emergencyNearby,
  };

  const total =
    base.lighting +
    base.crime +
    base.accident +
    base.activity +
    base.timeOfDay +
    base.emergencyNearby;

  if (total <= 0) {
    return { ...DEFAULT_FACTOR_WEIGHTS };
  }

  return {
    lighting: base.lighting / total,
    crime: base.crime / total,
    accident: base.accident / total,
    activity: base.activity / total,
    timeOfDay: base.timeOfDay / total,
    emergencyNearby: base.emergencyNearby / total,
  };
}

/**
 * Calculates risk level according to SRS / BRD specifications:
 * - Low: >= 75
 * - Moderate: 50 - 74.9
 * - High: < 50
 * - Insufficient data: when coverage < 60%
 */
export function determineRiskLevel(score: number | null, coverage: number): RiskLevel {
  if (coverage < 0.6 || score === null) {
    return 'Insufficient data';
  }
  if (score >= 75) {
    return 'Low';
  }
  if (score >= 50) {
    return 'Moderate';
  }
  return 'High';
}

/**
 * Core Safety Score Formula Engine
 *
 * Formula: Score = Sum(factor_score * factor_weight)
 * - Missing factors are marked "unknown".
 * - Missing weights are proportionally redistributed across known factors so weights always total 100%.
 * - If coverage < 60%, returns "Insufficient data".
 *
 * Acceptance Criteria Compliance:
 * Given factors (90, 88, 92, 80, 95, 85), score = 88.9, risk = Low.
 */
export function calculateSafetyScore(
  factorScores: FactorScoresInput,
  options: {
    customWeights?: Partial<FactorWeights>;
    coveragePercentage?: number; // 0 to 1.0 (default 1.0 if factors explicitly supplied)
    coverageThreshold?: number; // default 0.60
    dataFreshness?: string;
  } = {}
): SafetyScoreComputation {
  const coverageThreshold = options.coverageThreshold ?? 0.6;
  const initialWeights = normalizeWeights(options.customWeights);

  // Check which factors are known (non-null, non-undefined, valid number 0-100)
  const factorStatusMap = new Map<
    FactorKey,
    { rawScore: number | null; clampedScore: number | null; isKnown: boolean }
  >();

  let knownWeightSum = 0;
  let knownFactorsCount = 0;

  for (const key of ALL_FACTOR_KEYS) {
    const val = factorScores[key];
    if (val !== undefined && val !== null && !isNaN(val)) {
      const clamped = Math.max(0, Math.min(100, Number(val)));
      factorStatusMap.set(key, { rawScore: val, clampedScore: clamped, isKnown: true });
      knownWeightSum += initialWeights[key];
      knownFactorsCount++;
    } else {
      factorStatusMap.set(key, { rawScore: null, clampedScore: null, isKnown: false });
    }
  }

  // Coverage percentage: if explicitly given use it, else calculate from known factor ratio
  const coverage =
    options.coveragePercentage !== undefined
      ? options.coveragePercentage
      : knownFactorsCount / ALL_FACTOR_KEYS.length;

  const hasSufficientData = coverage >= coverageThreshold && knownFactorsCount > 0;

  // Redistribute missing weight across available factors so effective weights always sum to 100%
  const factorDetails = {} as Record<FactorKey, FactorDetail>;
  let totalScore = 0;
  let effectiveWeightsSum = 0;

  for (const key of ALL_FACTOR_KEYS) {
    const status = factorStatusMap.get(key)!;
    const baseWeight = initialWeights[key];

    let effectiveWeight = 0;
    let weightedScore: number | null = null;

    if (status.isKnown && knownWeightSum > 0) {
      effectiveWeight = baseWeight / knownWeightSum;
      weightedScore = (status.clampedScore as number) * effectiveWeight;
      totalScore += weightedScore;
      effectiveWeightsSum += effectiveWeight;
    }

    factorDetails[key] = {
      factor: key,
      score: status.clampedScore,
      rawScore: status.rawScore,
      weight: baseWeight,
      effectiveWeight,
      weightedScore,
      isKnown: status.isKnown,
      status: status.isKnown ? 'known' : 'unknown',
    };
  }

  // Round calculated score to 1 decimal place (e.g. 88.9)
  const finalScore = hasSufficientData && knownFactorsCount > 0 ? Math.round(totalScore * 10) / 10 : null;
  const riskLevel = determineRiskLevel(finalScore, coverage);

  return {
    score: finalScore,
    displayScore: finalScore !== null ? finalScore.toFixed(1) : 'unknown',
    riskLevel,
    hasSufficientData,
    status: hasSufficientData ? 'sufficient' : 'Insufficient data',
    coveragePercentage: Math.round(coverage * 1000) / 10, // e.g. 85.5%
    factors: factorDetails,
    weightsTotal: Math.round(effectiveWeightsSum * 100), // always 100% when data is present
    dataFreshness: options.dataFreshness || 'Up to date (Seed Registry v1.0)',
  };
}

/**
 * Samples points every ~200m along a route geometry using Turf.js (@turf/along).
 * Ensures start, intermediate points, and destination are reliably captured.
 */
export function sampleRoutePoints(
  coordinates: Array<[number, number]>, // [[lon, lat], ...]
  intervalMeters = 200
): Array<[number, number]> {
  if (!coordinates || coordinates.length === 0) {
    return [];
  }

  // Single point route
  if (coordinates.length === 1) {
    return [[coordinates[0][0], coordinates[0][1]]];
  }

  // Check for duplicate / zero-length line
  let isIdentical = true;
  for (let i = 1; i < coordinates.length; i++) {
    if (
      coordinates[i][0] !== coordinates[0][0] ||
      coordinates[i][1] !== coordinates[0][1]
    ) {
      isIdentical = false;
      break;
    }
  }
  if (isIdentical) {
    return [[coordinates[0][0], coordinates[0][1]]];
  }

  try {
    const line = lineString(coordinates);
    const totalDistanceKm = length(line, { units: 'kilometers' });
    const intervalKm = Math.max(0.05, intervalMeters / 1000.0); // e.g. 0.2 km

    const samplePoints: Array<[number, number]> = [];
    // Include starting point
    samplePoints.push([coordinates[0][0], coordinates[0][1]]);

    let currentDistKm = intervalKm;
    while (currentDistKm < totalDistanceKm - 0.05) {
      const sampled = along(line, currentDistKm, { units: 'kilometers' });
      samplePoints.push([
        sampled.geometry.coordinates[0],
        sampled.geometry.coordinates[1],
      ]);
      currentDistKm += intervalKm;
    }

    // Include destination point
    const lastCoord = coordinates[coordinates.length - 1];
    samplePoints.push([lastCoord[0], lastCoord[1]]);

    return samplePoints;
  } catch (err) {
    // Graceful fallback to raw coordinate vertices if Turf encounters an issue
    console.warn('[SafetyScoreService] Turf sampling error, falling back to vertices:', err);
    return coordinates.map((c) => [c[0], c[1]]);
  }
}

/**
 * Evaluates a route's safety score by sampling along the path and querying nearby
 * safety records and emergency locations using geospatial $geoNear queries.
 */
export async function evaluateRouteSafetyScore(
  options: RouteEvaluationOptions
): Promise<RouteSafetyEvaluationResult> {
  const coords = options.coordinates || [];
  const intervalMeters = options.sampleIntervalMeters ?? 200;
  const searchRadius = options.searchRadiusMeters ?? 250;
  const threshold = options.coverageThreshold ?? 0.6;

  // 1. Evaluate Time Factor
  const timeFactorResult = getTimeFactorScore(options.departureTime);

  // 2. Sample points along the route
  const sampledCoords = sampleRoutePoints(coords, intervalMeters);
  const samplePointsData: SamplePointData[] = [];

  let pointsWithDataCount = 0;
  let totalLightingScores: number[] = [];
  let totalCrimePenalties = 0;
  let totalAccidentPenalties = 0;
  let minEmergencyDistMeters = Infinity;
  let latestTimestamp: Date | null = null;

  // Calculate total route distance
  let totalDistanceKm = 0;
  if (coords.length >= 2) {
    try {
      const line = lineString(coords);
      totalDistanceKm = Math.round(length(line, { units: 'kilometers' }) * 100) / 100;
    } catch {
      totalDistanceKm = 1.0;
    }
  }

  // 3. Perform $geoNear spatial lookups along sample points
  for (let i = 0; i < sampledCoords.length; i++) {
    const pt = sampledCoords[i];
    const [lon, lat] = pt;

    let pointHasData = false;
    let safetyRecordsFound = 0;
    let emergencyFound = 0;
    let ptEmergencyDist: number | undefined;

    try {
      // Find safety records within 250m of point
      const nearbySafety = await SafetyRecord.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lon, lat] },
            distanceField: 'distance',
            maxDistance: searchRadius,
            spherical: true,
          },
        },
      ]);

      if (nearbySafety && nearbySafety.length > 0) {
        pointHasData = true;
        safetyRecordsFound = nearbySafety.length;

        for (const record of nearbySafety) {
          if (record.updatedAt) {
            const recDate = new Date(record.updatedAt);
            if (!latestTimestamp || recDate > latestTimestamp) {
              latestTimestamp = recDate;
            }
          }

          if (record.factor === 'lighting') {
            totalLightingScores.push(record.value);
          } else if (record.factor === 'crime') {
            const distance = record.distance || 0;
            const proximityFactor = Math.max(0, 1 - distance / searchRadius);
            totalCrimePenalties += proximityFactor * (record.value / 10);
          } else if (record.factor === 'accident') {
            const distance = record.distance || 0;
            const proximityFactor = Math.max(0, 1 - distance / searchRadius);
            totalAccidentPenalties += proximityFactor * (record.value / 10);
          }
        }
      }

      // Find nearest emergency location within 2.5 km of point
      const nearbyEmergency = await EmergencyLocation.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lon, lat] },
            distanceField: 'distance',
            maxDistance: 2500,
            spherical: true,
          },
        },
        { $limit: 1 },
      ]);

      if (nearbyEmergency && nearbyEmergency.length > 0) {
        emergencyFound = 1;
        ptEmergencyDist = nearbyEmergency[0].distance;
        if (ptEmergencyDist !== undefined && ptEmergencyDist < minEmergencyDistMeters) {
          minEmergencyDistMeters = ptEmergencyDist;
        }
      }
    } catch (queryErr) {
      // In case of query error, gracefully proceed
      console.warn('[SafetyScoreService] GeoNear query error at sample point:', queryErr);
    }

    if (pointHasData) {
      pointsWithDataCount++;
    }

    samplePointsData.push({
      coordinates: pt,
      distanceAlongKm: Math.round((i * (intervalMeters / 1000.0)) * 100) / 100,
      hasData: pointHasData,
      safetyRecordsCount: safetyRecordsFound,
      emergencyLocationsCount: emergencyFound,
      nearestEmergencyDistanceMeters: ptEmergencyDist,
    });
  }

  // 4. Calculate Normalized Factor Scores (0 - 100, where higher is safer)
  // Lighting factor
  let computedLighting = 80; // baseline moderate lighting
  if (totalLightingScores.length > 0) {
    const avg = totalLightingScores.reduce((a, b) => a + b, 0) / totalLightingScores.length;
    computedLighting = Math.round(avg);
  }

  // Crime factor (100 is safest, penalties deduct)
  const computedCrime = Math.max(20, Math.min(100, Math.round(100 - totalCrimePenalties * 2.5)));

  // Accident factor (100 is safest, penalties deduct)
  const computedAccident = Math.max(25, Math.min(100, Math.round(100 - totalAccidentPenalties * 2.0)));

  // Activity factor: higher pedestrian and lighting activity correlates with bystander presence
  const computedActivity = Math.min(95, Math.max(30, Math.round((computedLighting + 100 - totalCrimePenalties) / 2)));

  // Emergency nearby factor: closer facility gives higher score
  let computedEmergency = 75;
  if (minEmergencyDistMeters !== Infinity) {
    if (minEmergencyDistMeters <= 300) computedEmergency = 100;
    else if (minEmergencyDistMeters <= 750) computedEmergency = 88;
    else if (minEmergencyDistMeters <= 1500) computedEmergency = 75;
    else if (minEmergencyDistMeters <= 2500) computedEmergency = 60;
    else computedEmergency = 40;
  }

  // Merge with any custom factors provided in request
  const factorInput: FactorScoresInput = {
    lighting: options.customFactors?.lighting ?? computedLighting,
    crime: options.customFactors?.crime ?? computedCrime,
    accident: options.customFactors?.accident ?? computedAccident,
    activity: options.customFactors?.activity ?? computedActivity,
    timeOfDay: options.customFactors?.timeOfDay ?? timeFactorResult.score,
    emergencyNearby: options.customFactors?.emergencyNearby ?? computedEmergency,
  };

  // 5. Calculate Route Coverage %
  const totalSampleCount = Math.max(1, sampledCoords.length);
  const coverageRatio = pointsWithDataCount / totalSampleCount;

  // 6. Compute Safety Score with weighted redistribution
  const freshnessStr = latestTimestamp
    ? `Verified data up to ${latestTimestamp.toISOString().split('T')[0]}`
    : 'Seed Dataset (2024)';

  const computation = calculateSafetyScore(factorInput, {
    customWeights: options.customWeights,
    coveragePercentage: coverageRatio,
    coverageThreshold: threshold,
    dataFreshness: freshnessStr,
  });

  return {
    ...computation,
    totalDistanceKm,
    samplePointsCount: totalSampleCount,
    samplePointsWithDataCount: pointsWithDataCount,
    samplePoints: samplePointsData,
  };
}
