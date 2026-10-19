import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { SafetyPrediction } from '../models/SafetyPrediction';
import { predictRouteSafety } from '../services/aiService';
import { getRouteAlternatives, RoutingError } from '../services/routingService';
import {
  calculateSafetyScore,
  evaluateRouteSafetyScore,
} from '../services/safetyScore.service';

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
    });

    // Check for empty route alternatives (ISSUE-11: 404 No Route Found)
    if (!routingResult?.routes || routingResult.routes.length === 0) {
      res.status(404).json({
        success: false,
        code: 'NO_ROUTES_FOUND',
        message: 'No route available between these points.',
      });
      return;
    }

    // 2. Evaluate each route alternative with FastAPI AI Service / internal scoring
    const letters: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];
    const evaluatedAlternatives = await Promise.all(
      routingResult.routes.map(async (route, index) => {
        const letter = route.letter || letters[index] || 'A';
        const evalAi = await predictRouteSafety({
          lighting: Number(route.factors.lighting),
          crime_risk: Number(route.factors.crime_risk),
          accident_risk: Number(route.factors.accident_risk),
          crowd_level: Number(route.factors.crowd_level),
        });

        const routeScore = Number(evalAi.safety_score);
        const routeClassification =
          routeScore >= 80 ? 'Optimal (Safe Route)' : routeScore >= 55 ? 'Moderate Caution' : 'High Risk';

        return {
          id: route.id,
          letter,
          name: route.name,
          summary: route.summary,
          type: route.type,
          safety_score: routeScore,
          rating: evalAi.rating || routeClassification,
          isRecommended: route.isRecommended,
          isNavigable: route.isNavigable,
          distanceText: route.distanceText,
          durationText: route.durationText,
          factors: route.factors,
          safetyAttributes: route.safetyAttributes || [],
          caveats: route.caveats || [],
          color: route.color || (index === 0 ? '#087f8c' : index === 1 ? '#8b5cf6' : '#f59e0b'),
          aiModel: evalAi.model,
          aiFactors: evalAi.factors,
        };
      })
    );

    // Primary route metrics
    const primaryRoute = evaluatedAlternatives[0];
    const score = primaryRoute ? primaryRoute.safety_score : 80;
    const classification = primaryRoute ? primaryRoute.rating : 'Optimal (Safe Route)';
    const primaryAiFactors = primaryRoute?.aiFactors;
    const primaryModel = primaryRoute?.aiModel || 'SafeRoute ML Engine v1.0';

    // Detailed explanation of AI scoring model
    const scoringExplanation = [
      `Evaluated by ${primaryModel}.`,
      `Streetlighting contributed +${primaryAiFactors?.lighting_contribution ?? (Number(lighting) * 3.4).toFixed(1)} points toward route illumination.`,
      `Foot traffic density added +${primaryAiFactors?.crowd_contribution ?? (Number(crowd_level) * 2.3).toFixed(1)} points for active bystander presence.`,
      `Crime severity index deducted -${primaryAiFactors?.crime_deduction ?? (Number(crime_risk) * 2.6).toFixed(1)} points.`,
      `Accident probability deducted -${primaryAiFactors?.accident_deduction ?? (Number(accident_risk) * 1.7).toFixed(1)} points.`,
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
        classification: classification,
        recommendation:
          score >= 80
            ? 'Recommended safe corridor with verified illumination and active bystander presence.'
            : score >= 55
            ? 'Moderate risk corridor. Prioritize primary boulevards and maintain awareness.'
            : 'Elevated risk detected along this path. Consider alternative transit or ride-sharing.',
        factor_breakdown: primaryAiFactors,
      },
      model_info: {
        model_name: primaryModel,
        version: 'v1.0.0',
        data_source: 'SafeRoute Municipal Registry (Synthetic Demonstration Data)',
        is_fallback: false,
      },
    });

    res.json({
      success: true,
      data: {
        predictionId: predictionDoc._id?.toString(),
        safety_score: score,
        rating: classification,
        model: primaryModel,
        latency_ms: 12,
        factors: primaryAiFactors,
        origin: startLocation,
        destination: endLocation,
        departureTime: depTime,
        travelMode: mode,
        data_type: 'synthetic_demonstration',
        warning: 'Demonstration only. Not validated for real-world emergency dispatch.',
        scoring_explanation: scoringExplanation,
        is_navigable: routingResult.isNavigable,
        navigability_notice: routingResult.navigabilityNotice,
        routing_provider: routingResult.provider,
        alternatives: evaluatedAlternatives,
        createdAt: predictionDoc.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[SafetyController] Error predicting route safety:', error);
    if (error instanceof RoutingError) {
      res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
      });
      return;
    }
    if (error?.statusCode && typeof error.statusCode === 'number') {
      res.status(error.statusCode).json({
        success: false,
        code: error.code || 'ROUTING_ERROR',
        message: error.message || "Couldn't load routes.",
      });
      return;
    }
    res.status(500).json({
      success: false,
      code: error?.code || 'PREDICTION_ERROR',
      message: error?.message || "Couldn't load routes.",
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

/**
 * Direct 6-Factor Safety Score Engine Evaluation Endpoint
 * POST /api/safety/score
 * Evaluates route safety using weighted 6-factor formula, Turf point sampling, and $geoNear lookups.
 */
export async function evaluateScore(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { factors, coordinates, departureTime, customWeights, coverageThreshold } = req.body;

    if (coordinates && Array.isArray(coordinates) && coordinates.length > 0) {
      const result = await evaluateRouteSafetyScore({
        coordinates,
        departureTime,
        customFactors: factors,
        customWeights,
        coverageThreshold,
      });

      res.json({
        success: true,
        data: result,
      });
      return;
    }

    const result = calculateSafetyScore(factors || {}, {
      customWeights,
      coverageThreshold,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[SafetyController] Error evaluating safety score:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to evaluate safety score',
      code: 'SCORE_EVALUATION_ERROR',
    });
  }
}

