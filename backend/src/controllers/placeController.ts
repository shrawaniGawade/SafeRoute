import { Request, Response, NextFunction } from 'express';
import { CustomPlace, PlaceCategory, PinType } from '../models/CustomPlace';
import { EmergencyLocation } from '../models/EmergencyLocation';
import { HazardReport, HazardType } from '../models/HazardReport';
import {
  searchLocations,
  reverseGeocode,
  isValidCoordinate,
  parseDirectCoordinates,
} from '../services/geocodingService';

/**
 * GET /api/places/search
 * Comprehensive local place search: CustomPlaces + EmergencyLocations + External Geocoder (ORS / OSM).
 */
export async function searchPlaces(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawQ = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!rawQ) {
      res.json({
        success: true,
        query: '',
        count: 0,
        results: [],
      });
      return;
    }

    const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit || '8'), 10)));

    let focus: { lat: number; lng: number } | undefined;
    if (req.query.focusLat && req.query.focusLng) {
      const flat = parseFloat(String(req.query.focusLat));
      const flng = parseFloat(String(req.query.focusLng));
      if (isValidCoordinate(flat, flng)) {
        focus = { lat: flat, lng: flng };
      }
    }

    const results = await searchLocations(rawQ, limit, focus);

    // Optional category filtering
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const filteredResults = category
      ? results.filter((r) => r.category === category || r.type === category)
      : results;

    // Detect if user searched a pattern like "X near Y"
    let suggestedName = rawQ;
    let suggestedLandmark = '';
    const nearMatch = rawQ.match(/^(.+?)(?:,\s*|\s+)near(?:by)?\s+(.+)$/i);
    if (nearMatch) {
      suggestedName = nearMatch[1].trim();
      suggestedLandmark = nearMatch[2].trim();
    }

    res.json({
      success: true,
      query: rawQ,
      count: filteredResults.length,
      results: filteredResults,
      suggestionContext: {
        suggestedName,
        suggestedLandmark,
        canAddPlace: true,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/places/custom
 * Adds a missing place or community location (residential society, society gate, temple, landmark)
 */
export async function createCustomPlace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      name,
      category,
      pinType,
      lat,
      lng,
      address,
      locality,
      city,
      state,
      postcode,
      landmark,
      description,
      aliases,
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Place name is required (minimum 2 characters).',
      });
      return;
    }

    const numLat = parseFloat(String(lat));
    const numLng = parseFloat(String(lng));

    if (!isValidCoordinate(numLat, numLng)) {
      res.status(400).json({
        success: false,
        code: 'INVALID_COORDINATES',
        message: 'Please provide valid latitude and longitude coordinates.',
      });
      return;
    }

    const creatorName =
      (req as any).user?.name || (req as any).user?.email || req.body.creatorName || 'Community User';
    const creatorId = (req as any).user?.userId || null;

    const newPlace = await CustomPlace.create({
      name: name.trim(),
      aliases: Array.isArray(aliases) ? aliases.map((a: string) => a.trim()).filter(Boolean) : [],
      category: (category as PlaceCategory) || 'residential_society',
      pinType: (pinType as PinType) || 'general_place',
      location: {
        type: 'Point',
        coordinates: [numLng, numLat],
      },
      lat: numLat,
      lng: numLng,
      address: address ? address.trim() : `${name.trim()}, ${locality || ''}, ${city || 'Pune'}`,
      locality: locality ? locality.trim() : undefined,
      city: city ? city.trim() : 'Pune',
      state: state ? state.trim() : 'Maharashtra',
      postcode: postcode ? postcode.trim() : undefined,
      landmark: landmark ? landmark.trim() : undefined,
      description: description ? description.trim() : undefined,
      creatorName,
      creatorId,
      source: 'user_manual_pin',
      verificationStatus: 'community_submitted',
      isPublic: true,
    });

    res.status(201).json({
      success: true,
      message: 'Place added to SafeRoute successfully!',
      place: {
        id: newPlace._id,
        name: newPlace.name,
        category: newPlace.category,
        pinType: newPlace.pinType,
        lat: newPlace.lat,
        lng: newPlace.lng,
        displayName: newPlace.address || `${newPlace.name}, ${newPlace.locality || ''}, ${newPlace.city || ''}`,
        landmark: newPlace.landmark,
        locality: newPlace.locality,
        verificationStatus: newPlace.verificationStatus,
        source: newPlace.source,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/places/custom
 * Lists custom / community places with optional category or bounding box filters
 */
export async function getCustomPlaces(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: Record<string, any> = { isPublic: true };
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.verificationStatus) {
      filter.verificationStatus = req.query.verificationStatus;
    }

    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const places = await CustomPlace.find(filter).limit(limit);

    res.json({
      success: true,
      count: places.length,
      places,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/places/custom/:id/report
 * Flags or reports an inaccurate pin / duplicate place
 */
export async function reportCustomPlace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { reason, details } = req.body;

    const place = await CustomPlace.findById(id);
    if (!place) {
      res.status(404).json({
        success: false,
        message: 'Place not found.',
      });
      return;
    }

    const reportReason = `${reason || 'Incorrect Pin'}${details ? `: ${details}` : ''}`;
    const updatedCount = (place.reportCount || 0) + 1;
    const patch: Record<string, any> = {
      reportCount: updatedCount,
      $push: { reportReasons: reportReason },
    };

    if (updatedCount >= 3) {
      patch.verificationStatus = 'flagged';
    }

    await CustomPlace.findByIdAndUpdate(id, patch);

    res.json({
      success: true,
      message: 'Report received. Thank you for keeping SafeRoute maps accurate.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/places/nearby
 * Discovers verified emergency facilities, hospitals, police stations, and safe havens near a coordinate
 */
export async function getNearbyPlaces(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lat = parseFloat(String(req.query.lat));
    const lng = parseFloat(String(req.query.lng));

    if (!isValidCoordinate(lat, lng)) {
      res.status(400).json({
        success: false,
        message: 'Valid lat and lng query parameters are required.',
      });
      return;
    }

    const radiusMeters = Math.min(10000, Math.max(500, parseInt(String(req.query.radius || '3000'), 10)));
    const filterType = typeof req.query.type === 'string' ? req.query.type : undefined;

    // Proximity search on EmergencyLocation
    let emergencyPlaces: any[] = [];
    try {
      const pipeline: any[] = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distanceMeters',
            maxDistance: radiusMeters,
            spherical: true,
            query: filterType ? { type: filterType } : {},
          },
        },
        { $limit: 15 },
      ];
      emergencyPlaces = await EmergencyLocation.aggregate(pipeline);
    } catch {
      // Fallback simple search
      emergencyPlaces = await EmergencyLocation.find(filterType ? { type: filterType } : {}).limit(10);
    }

    // Also get nearby custom places (e.g. verified gates / temples)
    let nearbyCustom: any[] = [];
    try {
      const pipeline: any[] = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distanceMeters',
            maxDistance: radiusMeters,
            spherical: true,
            query: { isPublic: true },
          },
        },
        { $limit: 10 },
      ];
      nearbyCustom = await CustomPlace.aggregate(pipeline);
    } catch {
      nearbyCustom = await CustomPlace.find({ isPublic: true }).limit(5);
    }

    res.json({
      success: true,
      center: { lat, lng },
      radiusMeters,
      emergencyFacilities: emergencyPlaces.map((e) => ({
        id: e._id,
        name: e.name,
        type: e.type,
        lat: e.location?.coordinates?.[1],
        lng: e.location?.coordinates?.[0],
        phone: e.phone,
        address: e.address,
        distanceMeters: e.distanceMeters ? Math.round(e.distanceMeters) : undefined,
      })),
      communityPlaces: nearbyCustom.map((c) => ({
        id: c._id,
        name: c.name,
        category: c.category,
        pinType: c.pinType,
        lat: c.lat,
        lng: c.lng,
        landmark: c.landmark,
        locality: c.locality,
        verificationStatus: c.verificationStatus,
        distanceMeters: c.distanceMeters ? Math.round(c.distanceMeters) : undefined,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/places/hazards
 * Submits a community hazard report (broken streetlights, dark alley, road damage, harassment risk)
 */
export async function createHazardReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { hazardType, severity, description, lat, lng, landmark } = req.body;

    if (!description || typeof description !== 'string' || description.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: 'Please provide a brief description of the hazard.',
      });
      return;
    }

    const numLat = parseFloat(String(lat));
    const numLng = parseFloat(String(lng));

    if (!isValidCoordinate(numLat, numLng)) {
      res.status(400).json({
        success: false,
        message: 'Valid coordinates are required.',
      });
      return;
    }

    const reporter = (req as any).user?.name || req.body.reportedBy || 'Community Member';

    const hazard = await HazardReport.create({
      hazardType: (hazardType as HazardType) || 'broken_streetlight',
      severity: severity || 'medium',
      description: description.trim(),
      location: {
        type: 'Point',
        coordinates: [numLng, numLat],
      },
      lat: numLat,
      lng: numLng,
      landmark: landmark ? landmark.trim() : undefined,
      reportedBy: reporter,
      status: 'active',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day expiration
    });

    res.status(201).json({
      success: true,
      message: 'Hazard report submitted. SafeRoute will warn travelers along this corridor.',
      hazard,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/places/hazards
 * Retrieves active community hazards
 */
export async function getHazardReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hazards = await HazardReport.find({ status: 'active' }).limit(30);
    res.json({
      success: true,
      count: hazards.length,
      hazards,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/places/reverse
 * Reverse geocodes a latitude and longitude into an address or community landmark
 */
export async function reverseGeocodePlace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lat = parseFloat(String(req.query.lat));
    const lng = parseFloat(String(req.query.lng));

    if (!isValidCoordinate(lat, lng)) {
      res.status(400).json({
        success: false,
        message: 'Valid lat and lng query parameters are required.',
      });
      return;
    }

    const result = await reverseGeocode(lat, lng);
    res.json({
      success: true,
      result,
    });
  } catch (err) {
    next(err);
  }
}
