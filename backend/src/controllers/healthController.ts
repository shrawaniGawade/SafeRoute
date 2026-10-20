import { Request, Response } from 'express';
import { checkDBHealth } from '../config/db';
import { getAIServiceHealth } from '../services/aiService';
import { ENV } from '../config/env';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const [dbHealth, aiHealth] = await Promise.all([
    checkDBHealth(),
    getAIServiceHealth(),
  ]);

  const isHealthy = dbHealth.connected || !ENV.IS_PRODUCTION;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    message: 'SafeRoute API Gateway is operational',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: ENV.NODE_ENV,
    version: '1.0.0',
    services: {
      backend: {
        status: 'ONLINE',
        port: ENV.PORT,
      },
      database: {
        status: dbHealth.status,
        connected: dbHealth.connected,
        engine: dbHealth.connected ? 'MongoDB (Persistent)' : 'In-Memory (Development)',
        host: dbHealth.host,
        latencyMs: dbHealth.latencyMs,
        error: dbHealth.error,
      },
      aiEngine: {
        status: aiHealth.status,
        endpoint: ENV.AI_SERVICE_URL,
        latencyMs: aiHealth.latencyMs,
        architecture: aiHealth.modelArchitecture,
      },
    },
  });
}

export async function getDbHealth(_req: Request, res: Response): Promise<void> {
  const dbHealth = await checkDBHealth();
  res.status(dbHealth.connected ? 200 : 503).json({
    success: dbHealth.connected,
    ...dbHealth,
    troubleshooting: !dbHealth.connected
      ? {
          step1: 'Ensure MongoDB service is started (net start MongoDB or mongod)',
          step2: 'Or launch Docker container: docker compose up -d mongo',
          step3: 'Or configure MONGO_URI in backend/.env to your Atlas cloud URI',
        }
      : undefined,
  });
}

export async function getAIHealth(_req: Request, res: Response): Promise<void> {
  const aiHealth = await getAIServiceHealth();
  res.status(aiHealth.status === 'ONLINE' ? 200 : 503).json({
    success: aiHealth.status === 'ONLINE',
    ...aiHealth,
    endpoint: ENV.AI_SERVICE_URL,
  });
}
