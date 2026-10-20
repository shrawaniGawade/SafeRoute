import mongoose from 'mongoose';
import { ENV } from './env';

export interface DBHealthInfo {
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'DEGRADED';
  connected: boolean;
  readyState: number; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  host?: string;
  databaseName?: string;
  latencyMs?: number;
  error?: string;
}

let connectingPromise: Promise<void> | null = null;

let hasEverConnected = false;

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    try {
      const conn = await mongoose.connect(ENV.MONGO_URI, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 3000,
        maxPoolSize: 10,
        minPoolSize: 2,
      });

      hasEverConnected = true;
      console.log(`[Database] MongoDB successfully connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const isOffline = errorMsg.includes('ECONNREFUSED') || err?.name === 'MongoServerSelectionError';

      if (isOffline) {
        console.log(`[Database] Local MongoDB offline (${ENV.MONGO_URI}) -> In-Memory resilient data layer active.`);
      } else {
        console.warn(`[Database] MongoDB connection issue: ${errorMsg}`);
        console.log('[Database] Active Engine: In-Memory resilient data layer.');
      }

      if (ENV.IS_PRODUCTION && !process.env.VERCEL) {
        console.error('[Database CRITICAL] Cannot boot production server without a reachable MongoDB instance.');
        process.exit(1);
      }
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}

mongoose.connection.on('disconnected', () => {
  if (hasEverConnected) {
    console.warn('[Database] MongoDB connection dropped / disconnected.');
  }
});

mongoose.connection.on('reconnected', () => {
  hasEverConnected = true;
  console.log('[Database] MongoDB connection re-established.');
});

mongoose.connection.on('error', (err: any) => {
  if (!hasEverConnected) {
    return;
  }
  console.error('[Database] MongoDB runtime connection error:', err?.message || err);
});

/**
 * Health check probe to evaluate actual database connection and roundtrip latency
 */
export async function checkDBHealth(): Promise<DBHealthInfo> {
  const readyState = mongoose.connection.readyState;

  if (readyState !== 1) {
    return {
      status: readyState === 2 ? 'CONNECTING' : 'DISCONNECTED',
      connected: false,
      readyState,
      error: 'MongoDB is not connected. In-memory data layer active.',
    };
  }

  try {
    const start = Date.now();
    await mongoose.connection.db?.admin().ping();
    const latencyMs = Date.now() - start;

    return {
      status: 'CONNECTED',
      connected: true,
      readyState: 1,
      host: mongoose.connection.host,
      databaseName: mongoose.connection.name,
      latencyMs,
    };
  } catch (err: any) {
    return {
      status: 'DEGRADED',
      connected: false,
      readyState,
      error: err?.message || 'Database ping timeout',
    };
  }
}

/**
 * Cleanly terminate database connection during graceful server shutdown
 */
export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection closed gracefully.');
  }
}
