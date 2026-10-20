import axios from 'axios';
import { ENV } from '../config/env';

export interface AISafetyRequestInput {
  lighting: number;
  crime_risk: number;
  accident_risk: number;
  crowd_level: number;
}

export interface AISafetyPredictionOutput {
  safety_score: number;
  rating?: string;
  model: string;
  latency_ms?: number;
  factors?: {
    lighting_contribution?: number;
    crowd_contribution?: number;
    crime_deduction?: number;
    accident_deduction?: number;
  };
  data_type: string;
  warning?: string;
  is_fallback?: boolean;
}

/**
 * Predicts route safety by calling the FastAPI ML microservice.
 * Falls back to an onboard mathematical heuristic engine if the service is unreachable.
 */
export async function predictRouteSafety(
  input: AISafetyRequestInput
): Promise<AISafetyPredictionOutput> {
  const aiServiceUrl = ENV.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  const targetUrl = new URL(
    'predict',
    aiServiceUrl.endsWith('/') ? aiServiceUrl : `${aiServiceUrl}/`
  ).toString();

  const payload = {
    lighting: Number(input.lighting),
    crime_risk: Number(input.crime_risk),
    accident_risk: Number(input.accident_risk),
    crowd_level: Number(input.crowd_level),
  };

  try {
    const startTime = Date.now();
    const response = await axios.post(targetUrl, payload, { timeout: 3500 });
    const latencyMs = Date.now() - startTime;

    return {
      ...response.data,
      latency_ms: response.data.latency_ms || latencyMs,
      is_fallback: false,
    };
  } catch (_error) {
    // Resilient fallback scoring when remote AI service container is unreachable
    const rawScore =
      input.lighting * 3.5 +
      input.crowd_level * 2.5 +
      (10 - input.crime_risk) * 2.5 +
      (10 - input.accident_risk) * 1.5;
    const finalScore = Math.round(Math.max(0, Math.min(100, rawScore)) * 100) / 100;

    let rating = 'Optimal (Safe Route)';
    if (finalScore < 55) {
      rating = 'High Risk (Avoid if possible)';
    } else if (finalScore < 80) {
      rating = 'Moderate Caution';
    }

    return {
      safety_score: finalScore,
      rating,
      model: 'SafeRoute Heuristic Engine (Resilient Cloud Fallback)',
      latency_ms: 1,
      factors: {
        lighting_contribution: Math.round(input.lighting * 3.4 * 100) / 100,
        crowd_contribution: Math.round(input.crowd_level * 2.3 * 100) / 100,
        crime_deduction: Math.round(input.crime_risk * 2.6 * 100) / 100,
        accident_deduction: Math.round(input.accident_risk * 1.7 * 100) / 100,
      },
      data_type: 'synthetic_fallback_inference',
      warning: 'FastAPI microservice unreachable. Evaluated using onboard resilient formula.',
      is_fallback: true,
    };
  }
}

/**
 * Health probe for the FastAPI microservice
 */
export async function getAIServiceHealth(): Promise<{
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  modelArchitecture?: string;
  features?: string[];
}> {
  const aiServiceUrl = ENV.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  const targetUrl = new URL(
    'health',
    aiServiceUrl.endsWith('/') ? aiServiceUrl : `${aiServiceUrl}/`
  ).toString();

  try {
    const startTime = Date.now();
    const res = await axios.get(targetUrl, { timeout: 2000 });
    const latencyMs = Date.now() - startTime;

    return {
      status: 'ONLINE',
      latencyMs,
      modelArchitecture: res.data?.model_architecture || 'Random Forest Ensemble',
      features: res.data?.features || ['lighting', 'crime_risk', 'accident_risk', 'crowd_level'],
    };
  } catch {
    return {
      status: 'OFFLINE',
      latencyMs: 0,
    };
  }
}
