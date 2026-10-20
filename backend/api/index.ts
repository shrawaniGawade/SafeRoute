import app from '../src/server';
import { connectDB } from '../src/config/db';

/**
 * Vercel Serverless Function entry point for SafeRoute Express API Gateway.
 * Ensures MongoDB connection is ready before processing the Express request cycle.
 */
export default async function handler(req: any, res: any) {
  try {
    await connectDB();
  } catch (err) {
    console.warn('[Vercel Handler] Initial connectDB warning:', err);
  }
  return app(req, res);
}
