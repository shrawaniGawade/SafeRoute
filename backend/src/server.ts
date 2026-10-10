import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { ENV } from './config/env';
import { connectDB } from './config/db';
import { seedDefaultAdmin } from './config/seedAdmin';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import { predictRouteSafety } from './services/aiService';

dotenv.config();

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration supporting credentials (cookies)
const allowedOrigins = [
  ENV.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, or specify strict matching
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB and seed default admin
connectDB().finally(() => {
  seedDefaultAdmin();
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'SafeRoute backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Admin dashboard routes
app.use('/api/admin', adminRoutes);

// AI safety prediction proxy endpoint
app.post('/api/safety/predict', async (req, res) => {
  try {
    const result = await predictRouteSafety(req.body);
    res.json(result);
  } catch (error) {
    console.error('AI service error:', error);
    res.status(502).json({
      message: 'Could not get a prediction from the AI service',
    });
  }
});

const PORT = ENV.PORT;

if (!process.env.VERCEL && !process.env.CI && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`SafeRoute backend running at http://localhost:${PORT}`);
  });
}

export default app;
