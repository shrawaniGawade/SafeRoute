import { Request, Response, NextFunction } from 'express';
import { geocodeQuerySchema } from '../validators/geocodingValidators';
import { searchLocations } from '../services/geocodingService';

/**
 * GET /api/geocode?q=&limit=
 * Autocomplete / forward geocoding with Zod validation, caching, and rate limiting
 */
export async function geocode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = geocodeQuerySchema.parse(req.query);
    const limit = validated.limit || 5;
    const results = await searchLocations(validated.q, limit);

    res.json({
      success: true,
      query: validated.q,
      count: results.length,
      results,
    });
  } catch (err) {
    next(err);
  }
}
