import axios from 'axios';

export async function predictRouteSafety(input: {
  lighting: number;
  crime_risk: number;
  accident_risk: number;
  crowd_level: number;
}) {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  const targetUrl = new URL('predict', aiServiceUrl.endsWith('/') ? aiServiceUrl : `${aiServiceUrl}/`).toString();

  try {
    const response = await axios.post(targetUrl, input, { timeout: 3500 });
    return response.data;
  } catch (_error) {
    // Resilient fallback scoring when remote AI service container is unreachable
    const rawScore =
      (input.lighting * 3.5) +
      (input.crowd_level * 2.5) +
      ((10 - input.crime_risk) * 2.5) +
      ((10 - input.accident_risk) * 1.5);
    const score = Math.round(Math.max(0, Math.min(100, rawScore)) * 100) / 100;

    return {
      safety_score: score,
      model: "Synthetic Demonstration Engine (Cloud Edge Fallback)",
      data_type: "synthetic_demo",
      warning: "Demonstration only. Not validated for real-world safety."
    };
  }
}

