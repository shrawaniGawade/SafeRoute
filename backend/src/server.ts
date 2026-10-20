import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { ENV } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { seedDefaultAdmin } from './config/seedAdmin';

// Middleware imports
import { requestLogger, requestTimeout } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import safetyRoutes from './routes/safetyRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import routeHistoryRoutes from './routes/routeHistoryRoutes';
import geocodingRoutes from './routes/geocodingRoutes';
import placeRoutes from './routes/placeRoutes';
import { seedDefaultPlaces } from './config/seedPlaces';

// Direct controller for root /health
import { getHealth } from './controllers/healthController';

dotenv.config();

const app = express();

// Security HTTP headers
app.use(helmet());

// Request logging & timeout protection
app.use(requestLogger);
app.use(requestTimeout(15000));

// CORS configuration supporting credentials (cookies) and Vercel deployments
const configuredOrigins = (process.env.CORS_ORIGIN || ENV.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server, health probes)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow any Vercel preview deployment under .vercel.app
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch {
        // invalid URL
      }
      if (!ENV.IS_PRODUCTION) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Connect to MongoDB and seed default admin account and places
connectDB().finally(() => {
  seedDefaultAdmin();
  seedDefaultPlaces();
});

// Root Health Endpoint: GET /health
app.get('/health', getHealth);

// API Route Modules
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/routes', routeHistoryRoutes);
app.use('/api/geocode', geocodingRoutes);
app.use('/api/places', placeRoutes);

// Catch-all 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

const PORT = ENV.PORT;

const isTestEnv =
  process.env.NODE_ENV === 'test' ||
  process.env.npm_lifecycle_event === 'test' ||
  process.argv.includes('--test') ||
  Boolean(process.env.CI);

let server: any;
if (!process.env.VERCEL && !isTestEnv) {
  server = app.listen(PORT, () => {
    console.log(`[Server] SafeRoute backend running at http://localhost:${PORT}`);
  });
}

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Closing HTTP server and database connections...`);
  if (server) {
    server.close(() => {
      console.log('[Server] HTTP server closed.');
    });
  }
  await disconnectDB();
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
