import app from '../backend/src/server';
import { connectDB } from '../backend/src/config/db';

/**
 * Vercel Serverless Function entry point for SafeRoute monorepo root.
 * Ensures MongoDB connection is ready before processing the Express request cycle.
 */
export default async function handler(req: any, res: any) {
  try {
    await connectDB();
  } catch (err) {
    console.warn('[Vercel Root Handler] Initial connectDB warning:', err);
  }
  return app(req, res);
}
