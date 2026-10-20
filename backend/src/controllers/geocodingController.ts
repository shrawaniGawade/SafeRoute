import { Request, Response, NextFunction } from 'express';
import { geocodeQuerySchema } from '../validators/geocodingValidators';
import { searchLocations, parseDirectCoordinates } from '../services/geocodingService';

/**
 * Autocomplete / forward geocoding with Zod validation, caching, and rate limiting.
 * Handles both GET /api/safety/geocode?q= and GET /api/geocode?q=.
 */
export async function geocode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawQ = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    // If query matches direct lat,lng format, resolve immediately without min(3) restriction
    const directCoord = parseDirectCoordinates(rawQ);
    if (directCoord) {
      res.json({
        success: true,
        query: rawQ,
        count: 1,
        results: [directCoord],
      });
      return;
    }

    const validated = geocodeQuerySchema.parse(req.query);
    const limit = validated.limit || 5;

    let focus: { lat: number; lng: number } | undefined;
    if (req.query.focusLat && req.query.focusLng) {
      const flat = parseFloat(String(req.query.focusLat));
      const flng = parseFloat(String(req.query.focusLng));
      if (!isNaN(flat) && !isNaN(flng)) {
        focus = { lat: flat, lng: flng };
      }
    }

    const results = await searchLocations(validated.q, limit, focus);

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
