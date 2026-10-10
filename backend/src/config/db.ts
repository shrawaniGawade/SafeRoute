import mongoose from 'mongoose';
import { ENV } from './env';

export async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
  } catch (_error) {
    console.warn(
      `[Database] Note: MongoDB not reachable at ${ENV.MONGO_URI}. Operating in In-Memory Development Mode.`
    );
    if (ENV.IS_PRODUCTION) {
      process.exit(1);
    }
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB runtime error:', err);
  });
}
