const API_BASE_URL = "http://localhost:5000/api";

export interface SafetyInput {
  lighting: number;
  crime_risk: number;
  accident_risk: number;
  crowd_level: number;
}

export interface SafetyResult {
  safety_score: number;
  model: string;
  data_type: string;
  warning: string;
}

export async function predictRouteSafety(
  input: SafetyInput
): Promise<SafetyResult> {
  const response = await fetch(`${API_BASE_URL}/safety/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<SafetyResult>;
}