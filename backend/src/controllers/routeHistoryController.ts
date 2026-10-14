import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { SafetyPrediction } from '../models/SafetyPrediction';
import { RouteHistory } from '../models/RouteHistory';
import { predictRouteSafety } from '../services/aiService';

export async function evaluateAndSavePrediction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      lighting,
      crime_risk,
      accident_risk,
      crowd_level,
      origin,
      source,
      destination,
      departureTime,
      travelMode,
      clientRequestId,
    } = req.body;

    const startLoc = origin || source;

    // Idempotent retry check: if clientRequestId provided, check if already recorded
    if (clientRequestId) {
      const existing = await SafetyPrediction.findOne({ clientRequestId });
      if (existing) {
        res.json({
          safety_score: existing.safety_score,
          model: existing.model_info?.model_name,
          data_type: 'idempotent_cached',
          predictionId: existing._id?.toString(),
          cached: true,
        });
        return;
      }
    }

    const aiResult = await predictRouteSafety({
      lighting: Number(lighting),
      crime_risk: Number(crime_risk),
      accident_risk: Number(accident_risk),
      crowd_level: Number(crowd_level),
    });

    const score = Number(aiResult.safety_score);
    const classification =
      score >= 80 ? 'Safe' : score >= 50 ? 'Moderate Caution' : 'High Caution';

    // Persist to SafetyPrediction model
    const predictionDoc = await SafetyPrediction.create({
      user: req.user?.userId || null,
      clientRequestId: clientRequestId || undefined,
      origin: startLoc,
      destination,
      departureTime: departureTime || 'Immediate',
      travelMode: travelMode || 'walking',
      factors: {
        lighting: Number(lighting),
        crime_risk: Number(crime_risk),
        accident_risk: Number(accident_risk),
        crowd_level: Number(crowd_level),
      },
      safety_score: score,
      prediction_details: {
        classification,
        recommendation:
          score >= 80
            ? 'Recommended safe corridor with adequate lighting and active pedestrian density.'
            : score >= 50
            ? 'Moderate risk corridor. Prioritize primary boulevards and stay visible.'
            : 'Elevated risk detected. Consider alternative corridors or transit.',
        factor_breakdown: {
          lighting: Number(lighting),
          crime_risk: Number(crime_risk),
          accident_risk: Number(accident_risk),
          crowd_level: Number(crowd_level),
        },
      },
      model_info: {
        model_name: aiResult.model || 'SafeRoute RandomForestClassifier',
        version: 'v1.0.0',
        data_source: 'SafeRoute Municipal Open Crime & Infrastructure Registry',
        is_fallback: aiResult.data_type === 'synthetic_demo',
      },
    });

    res.json({
      ...aiResult,
      predictionId: predictionDoc._id?.toString(),
    });
  } catch (error: any) {
    console.error('[RouteHistoryController] Error evaluating prediction:', error);
    res.status(500).json({
      message: error?.message || 'Failed to evaluate route safety prediction',
    });
  }
}

export async function saveRouteHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { origin, destination, selectedRoute, predictionId, clientRequestId, status } = req.body;

    // Rule: Store selected or requested routes only if route data is actually available
    if (!origin?.name || !destination?.name) {
      res.status(400).json({
        message: 'Origin and destination waypoint names are required.',
      });
      return;
    }

    if (!selectedRoute || !selectedRoute.routeName || !selectedRoute.travelMode) {
      res.status(400).json({
        message: 'Route data is missing. Selected routes are stored only when valid route information is available.',
      });
      return;
    }

    // Idempotent duplicate check
    if (clientRequestId) {
      const existing = await RouteHistory.findOne({ clientRequestId });
      if (existing) {
        res.json({
          success: true,
          message: 'Route history record already exists (idempotent)',
          route: existing,
        });
        return;
      }
    }

    const routeRecord = await RouteHistory.create({
      user: req.user?.userId || null,
      predictionId: predictionId || null,
      clientRequestId: clientRequestId || undefined,
      origin: {
        name: origin.name,
        coordinates: origin.coordinates,
      },
      destination: {
        name: destination.name,
        coordinates: destination.coordinates,
      },
      selectedRoute: {
        routeName: selectedRoute.routeName,
        travelMode: selectedRoute.travelMode,
        distanceText: selectedRoute.distanceText,
        durationText: selectedRoute.durationText,
        safetyScore: selectedRoute.safetyScore ?? 80,
        waypoints: selectedRoute.waypoints || [],
        polyline: selectedRoute.polyline,
        summary: selectedRoute.summary,
      },
      status: status || 'selected',
    });

    res.status(201).json({
      success: true,
      message: 'Route history record successfully saved.',
      route: routeRecord,
    });
  } catch (error: any) {
    console.error('[RouteHistoryController] Error saving route history:', error);
    res.status(500).json({
      message: error?.message || 'Failed to save route history',
    });
  }
}

export async function getUserRouteHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    // Ownership restriction: Regular users can only access their own history
    const query: any = {};
    if (req.user?.role !== 'admin' || !req.query.all) {
      query.user = userId;
    }

    const routes = await RouteHistory.find(query).sort({ createdAt: -1 }).limit(50);

    res.json({
      success: true,
      count: routes.length,
      routes,
    });
  } catch (error: any) {
    console.error('[RouteHistoryController] Error fetching route history:', error);
    res.status(500).json({
      message: 'Internal server error retrieving route history.',
    });
  }
}

export async function deleteUserRouteHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const route = await RouteHistory.findById(id);

    if (!route) {
      res.status(404).json({ message: 'Route record not found.' });
      return;
    }

    // Ownership restriction check
    if (req.user?.role !== 'admin' && route.user?.toString() !== req.user?.userId) {
      res.status(403).json({
        message: 'Access denied: You do not have ownership of this route record.',
      });
      return;
    }

    await RouteHistory.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Route record deleted successfully.',
    });
  } catch (error: any) {
    console.error('[RouteHistoryController] Error deleting route history:', error);
    res.status(500).json({
      message: 'Internal server error deleting route record.',
    });
  }
}
