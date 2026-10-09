import { predictRouteSafety } from './services/aiService';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'SafeRoute backend is running',
  });
});

const PORT = Number(process.env.PORT) || 5000;

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

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`SafeRoute backend running at http://localhost:${PORT}`);
  });
}

export default app;



