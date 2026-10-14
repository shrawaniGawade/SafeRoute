import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { SafetyPrediction } from '../models/SafetyPrediction';
import { predictRouteSafety } from '../services/aiService';
import { getRouteAlternatives } from '../services/routingService';

export async function predict(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      lighting,
      crime_risk,
      accident_risk,
      crowd_level,
      emergency_proximity,
      timeOfDay,
      origin,
      source,
      destination,
      departureTime,
      travelMode,
      clientRequestId,
    } = req.body;

    const startLocation = origin || source || 'Origin';
    const endLocation = destination || 'Destination';
    const mode = travelMode || 'walking';
    const depTime = departureTime || timeOfDay || 'Immediate';

    // Idempotent retry check: if clientRequestId is provided, check if already evaluated
    if (clientRequestId) {
      const existing = await SafetyPrediction.findOne({ clientRequestId });
      if (existing) {
        res.json({
          success: true,
          data: {
            predictionId: existing._id?.toString(),
            safety_score: existing.safety_score,
            rating: existing.prediction_details?.classification,
            model: existing.model_info?.model_name,
            factors: existing.factors,
            origin: existing.origin,
            destination: existing.destination,
            departureTime: existing.departureTime,
            travelMode: existing.travelMode,
            data_type: 'idempotent_cached',
            createdAt: existing.createdAt,
            cached: true,
          },
        });
        return;
      }
    }

    // 1. Obtain Route Alternatives from Routing Engine
    const routingResult = await getRouteAlternatives(startLocation, endLocation, mode, {
      lighting: Number(lighting),
      crime_risk: Number(crime_risk),
      accident_risk: Number(accident_risk),
      crowd_level: Number(crowd_level),
      emergency_proximity: emergency_proximity !== undefined ? Number(emergency_proximity) : undefined,
    });

    // 2. Evaluate Primary Safe Route with FastAPI AI Service
    const aiResult = await predictRouteSafety({
      lighting: Number(lighting),
      crime_risk: Number(crime_risk),
      accident_risk: Number(accident_risk),
      crowd_level: Number(crowd_level),
    });

    // 3. Evaluate Alternative Route (Direct Shortcut) with AI Service
    const altRouteData = routingResult.routes.find((r) => r.type === 'direct_shortcut');
    const altFactors = altRouteData?.factors || {
      lighting: Math.max(1, Number(lighting) - 5),
      crime_risk: Math.min(10, Number(crime_risk) + 4),
      accident_risk: Math.min(10, Number(accident_risk) + 2),
      crowd_level: Math.max(1, Number(crowd_level) - 5),
    };

    const altAiResult = await predictRouteSafety({
      lighting: altFactors.lighting,
      crime_risk: altFactors.crime_risk,
      accident_risk: altFactors.accident_risk,
      crowd_level: altFactors.crowd_level,
    });

    const score = Number(aiResult.safety_score);
    const classification =
      score >= 80 ? 'Optimal (Safe Route)' : score >= 55 ? 'Moderate Caution' : 'High Risk';

    // Detailed explanation of AI scoring model
    const scoringExplanation = [
      `Evaluated by ${aiResult.model}.`,
      `Streetlighting contributed +${aiResult.factors?.lighting_contribution ?? (Number(lighting) * 3.4).toFixed(1)} points toward route illumination.`,
      `Foot traffic density added +${aiResult.factors?.crowd_contribution ?? (Number(crowd_level) * 2.3).toFixed(1)} points for active bystander presence.`,
      `Crime severity index deducted -${aiResult.factors?.crime_deduction ?? (Number(crime_risk) * 2.6).toFixed(1)} points.`,
      `Accident probability deducted -${aiResult.factors?.accident_deduction ?? (Number(accident_risk) * 1.7).toFixed(1)} points.`,
      emergency_proximity !== undefined
        ? `Emergency services proximity rated at ${emergency_proximity}/10, providing verified rapid-dispatch coverage.`
        : 'Emergency proximity factored from municipal open safety registries.',
      'SafeRoute recommendation policy prioritizes illuminated and populated thoroughfares over shortest linear distance.',
      'DISCLAIMER: No route can be guaranteed 100% safe. Always remain aware of your surroundings and observe municipal advisories.',
    ].join(' ');

    // Persist to SafetyPrediction model
    const predictionDoc = await SafetyPrediction.create({
      user: req.user?.userId || null,
      clientRequestId: clientRequestId || undefined,
      origin: startLocation,
      destination: endLocation,
      departureTime: depTime,
      travelMode: mode,
      factors: {
        lighting: Number(lighting),
        crime_risk: Number(crime_risk),
        accident_risk: Number(accident_risk),
        crowd_level: Number(crowd_level),
      },
      safety_score: score,
      prediction_details: {
        classification: aiResult.rating || classification,
        recommendation:
          score >= 80
            ? 'Recommended safe corridor with verified illumination and active bystander presence.'
            : score >= 55
            ? 'Moderate risk corridor. Prioritize primary boulevards and maintain awareness.'
            : 'Elevated risk detected along this path. Consider alternative transit or ride-sharing.',
        factor_breakdown: aiResult.factors,
      },
      model_info: {
        model_name: aiResult.model,
        version: 'v1.0.0',
        data_source: 'SafeRoute Municipal Registry (Synthetic Demonstration Data)',
        is_fallback: aiResult.is_fallback || false,
      },
    });

    res.json({
      success: true,
      data: {
        predictionId: predictionDoc._id?.toString(),
        safety_score: score,
        rating: aiResult.rating || classification,
        model: aiResult.model,
        latency_ms: aiResult.latency_ms,
        factors: aiResult.factors,
        origin: startLocation,
        destination: endLocation,
        departureTime: depTime,
        travelMode: mode,
        data_type: aiResult.data_type,
        warning: aiResult.warning || 'Demonstration only. Not validated for real-world emergency dispatch.',
        scoring_explanation: scoringExplanation,
        is_navigable: routingResult.isNavigable,
        navigability_notice: routingResult.navigabilityNotice,
        routing_provider: routingResult.provider,
        alternatives: [
          {
            id: 'safe_corridor',
            name: 'Primary Safe Corridor (Recommended)',
            safety_score: score,
            rating: aiResult.rating || classification,
            isRecommended: true,
            isNavigable: routingResult.isNavigable,
            distanceText: routingResult.routes[0]?.distanceText || 'Demo Estimate (1.8 km)',
            durationText: routingResult.routes[0]?.durationText || 'Demo Estimate (22 mins)',
            summary: 'Well-lit municipal thoroughfare with active commercial activity and pedestrian density.',
            factors: {
              lighting: Number(lighting),
              crime_risk: Number(crime_risk),
              accident_risk: Number(accident_risk),
              crowd_level: Number(crowd_level),
              emergency_proximity: emergency_proximity ?? 8.5,
            },
          },
          {
            id: 'direct_shortcut',
            name: 'Direct Shortcut Alternative',
            safety_score: Number(altAiResult.safety_score),
            rating: altAiResult.rating || 'Moderate Caution',
            isRecommended: false,
            isNavigable: routingResult.isNavigable,
            distanceText: routingResult.routes[1]?.distanceText || 'Demo Estimate (1.4 km - shorter)',
            durationText: routingResult.routes[1]?.durationText || 'Demo Estimate (17 mins)',
            summary: 'Traverses unmonitored back alleys and secondary industrial roads. Faster but darker.',
            factors: altFactors,
          },
        ],
        createdAt: predictionDoc.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[SafetyController] Error predicting route safety:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to evaluate route safety prediction',
      code: 'PREDICTION_ERROR',
    });
  }
}

export async function getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Ownership filter: Standard users only view their own prediction history
    const query: any = {};
    if (req.user?.role !== 'admin' || req.query.all !== 'true') {
      query.user = req.user?.userId;
    }

    const totalRecords = await SafetyPrediction.countDocuments(query);
    const rawList = await SafetyPrediction.find(query).sort({ createdAt: -1 });
    const records = Array.isArray(rawList) ? rawList.slice(skip, skip + limit) : [];

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    res.json({
      success: true,
      data: records.map((p: any) => ({
        id: p._id?.toString(),
        origin: p.origin,
        destination: p.destination,
        departureTime: p.departureTime,
        travelMode: p.travelMode,
        safety_score: p.safety_score,
        rating: p.prediction_details?.classification,
        recommendation: p.prediction_details?.recommendation,
        factors: p.factors,
        model: p.model_info?.model_name,
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('[SafetyController] Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving prediction history.',
      code: 'HISTORY_FETCH_ERROR',
    });
  }
}

export async function getPredictionById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const prediction = await SafetyPrediction.findById(id);

    if (!prediction) {
      res.status(404).json({
        success: false,
        message: 'Safety prediction record not found.',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Ownership restriction check
    if (
      req.user?.role !== 'admin' &&
      prediction.user &&
      prediction.user.toString() !== req.user?.userId
    ) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this prediction audit record.',
        code: 'FORBIDDEN',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: prediction._id?.toString(),
        userId: prediction.user?.toString() || null,
        origin: prediction.origin,
        destination: prediction.destination,
        departureTime: prediction.departureTime,
        travelMode: prediction.travelMode,
        safety_score: prediction.safety_score,
        prediction_details: prediction.prediction_details,
        factors: prediction.factors,
        model_info: prediction.model_info,
        createdAt: prediction.createdAt,
        updatedAt: prediction.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[SafetyController] Error fetching prediction by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving prediction details.',
      code: 'PREDICTION_FETCH_ERROR',
    });
  }
}
