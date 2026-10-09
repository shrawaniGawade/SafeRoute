
import axios from 'axios';

const AI_SERVICE_URL = 'http://127.0.0.1:8000';

export async function predictRouteSafety(input: {
  lighting: number;
  crime_risk: number;
  accident_risk: number;
  crowd_level: number;
}) {
  const response = await axios.post(
    `${AI_SERVICE_URL}/predict`,
    input
  );

  return response.data;
}
