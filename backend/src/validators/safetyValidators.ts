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
});

export const safetyHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  all: z.coerce.boolean().optional(),
});
