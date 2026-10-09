import axios from 'axios';

export async function predictRouteSafety(input: {
  lighting: number;
  crime_risk: number;
  accident_risk: number;
  crowd_level: number;
}) {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  const targetUrl = new URL('predict', aiServiceUrl.endsWith('/') ? aiServiceUrl : `${aiServiceUrl}/`).toString();

  const response = await axios.post(targetUrl, input);

  return response.data;
}

