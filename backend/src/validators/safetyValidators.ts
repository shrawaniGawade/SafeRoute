import { z } from 'zod';

export const predictSafetySchema = z.object({
  lighting: z.coerce
    .number()
    .min(0, 'Lighting score must be between 0 and 10')
    .max(10, 'Lighting score must be between 0 and 10'),
  crime_risk: z.coerce
    .number()
    .min(0, 'Crime risk must be between 0 and 10')
    .max(10, 'Crime risk must be between 0 and 10'),
  accident_risk: z.coerce
    .number()
    .min(0, 'Accident risk must be between 0 and 10')
    .max(10, 'Accident risk must be between 0 and 10'),
  crowd_level: z.coerce
    .number()
    .min(0, 'Crowd level must be between 0 and 10')
    .max(10, 'Crowd level must be between 0 and 10'),
  origin: z.string().trim().max(200).optional(),
  source: z.string().trim().max(200).optional(),
  destination: z.string().trim().max(200).optional(),
  departureTime: z.string().trim().optional(),
  timeOfDay: z.string().trim().optional(),
  emergency_proximity: z.coerce.number().min(0).max(10).optional(),
  travelMode: z.enum(['walking', 'driving', 'transit']).default('walking').optional(),
  clientRequestId: z.string().trim().optional(),
  maxDetour: z.union([z.number(), z.record(z.string(), z.any())]).optional(),
  maxDetourMinutes: z.number().optional(),
  preferences: z.record(z.string(), z.any()).optional(),
}).passthrough();

export const safetyHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  all: z.coerce.boolean().optional(),
});

export const evaluateSafetyScoreSchema = z.object({
  factors: z
    .object({
      lighting: z.number().min(0).max(100).nullable().optional(),
      crime: z.number().min(0).max(100).nullable().optional(),
      accident: z.number().min(0).max(100).nullable().optional(),
      activity: z.number().min(0).max(100).nullable().optional(),
      timeOfDay: z.number().min(0).max(100).nullable().optional(),
      emergencyNearby: z.number().min(0).max(100).nullable().optional(),
    })
    .optional(),
  coordinates: z.array(z.tuple([z.number(), z.number()])).optional(),
  departureTime: z.union([z.string(), z.number()]).optional(),
  coverageThreshold: z.number().min(0).max(1).optional(),
  customWeights: z
    .object({
      lighting: z.number().min(0).max(1).optional(),
      crime: z.number().min(0).max(1).optional(),
      accident: z.number().min(0).max(1).optional(),
      activity: z.number().min(0).max(1).optional(),
      timeOfDay: z.number().min(0).max(1).optional(),
      emergencyNearby: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

