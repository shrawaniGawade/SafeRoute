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
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 5000,
        maxPoolSize: 10,
        minPoolSize: 2,
      });

      console.log(`[Database] MongoDB successfully connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.warn('\n================================================================================');
    console.warn('[DATABASE WARNING] MongoDB is currently unavailable or offline.');
    console.warn(`Target URI: ${ENV.MONGO_URI}`);
    console.warn(`Error Detail: ${errorMsg}`);
    console.warn('--------------------------------------------------------------------------------');
    console.warn('REQUIRED SETUP FOR PERSISTENT DATABASE STORAGE:');
    console.warn('1. Local MongoDB: Start the local service (e.g., `net start MongoDB` or `mongod`).');
    console.warn('2. Docker: Run `docker-compose up -d mongo` to launch a containerized instance.');
    console.warn('3. MongoDB Atlas (Cloud): Set MONGO_URI in backend/.env to your Atlas cluster:');
    console.warn('   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/saferoute?retryWrites=true&w=majority');
    console.warn('--------------------------------------------------------------------------------');
    console.warn('OPERATIONAL FALLBACK NOTICE:');
    console.warn('Operating with in-memory fallback layer for local development and unit tests.');
    console.warn('In production (NODE_ENV=production), persistent database connection is mandatory.');
    console.warn('================================================================================\n');

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
  console.warn('[Database] MongoDB connection dropped / disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB connection re-established.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database] MongoDB runtime connection error:', err);
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
