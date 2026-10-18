import { z } from 'zod';

export const geocodeQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(3, 'Search query must be at least 3 characters')
    .max(120, 'Search query cannot exceed 120 characters'),
  limit: z.coerce.number().int().min(1).max(10).default(5).optional(),
});

export type GeocodeQueryInput = z.infer<typeof geocodeQuerySchema>;
