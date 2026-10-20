import mongoose from 'mongoose';
import { connectDB, checkDBHealth, disconnectDB } from './db';
import { MongoUser } from '../models/User';
import { MongoSafetyPrediction } from '../models/SafetyPrediction';
import { MongoRouteHistory } from '../models/RouteHistory';
import { MongoAuditLog, logAdminAction } from '../models/AuditLog';
import { seedDefaultAdmin } from './seedAdmin';

async function initDatabase(): Promise<void> {
  console.log('========================================================================');
  console.log('  SafeRoute Database Initialization & Index Synchronization Script');
  console.log('========================================================================');

  try {
    await connectDB();
    const health = await checkDBHealth();

    if (!health.connected) {
      console.warn('\n[Init] Note: MongoDB connection could not be established.');
      console.warn('[Init] Please verify your MongoDB service or Atlas connection string in .env.');
      console.warn('[Init] Skipping persistent collection index creation.');
      process.exit(1);
    }

    console.log(`\n[Init] Connected to database: ${health.databaseName} on host: ${health.host}`);

    // Synchronize Mongoose Indexes
    console.log('[Init] Ensuring indexes for User collection...');
    await MongoUser.init();
    await MongoUser.syncIndexes();
    console.log('  ✔ User indexes synchronized (unique email_1, role_1, isVerified_1)');

    console.log('[Init] Ensuring indexes for SafetyPrediction collection...');
    await MongoSafetyPrediction.init();
    await MongoSafetyPrediction.syncIndexes();
    console.log('  ✔ SafetyPrediction indexes synchronized (user_1_createdAt_-1, clientRequestId_1, createdAt_-1)');

    console.log('[Init] Ensuring indexes for RouteHistory collection...');
    await MongoRouteHistory.init();
    await MongoRouteHistory.syncIndexes();
    console.log('  ✔ RouteHistory indexes synchronized (user_1_createdAt_-1, origin.name_1_destination.name_1)');

    console.log('[Init] Ensuring indexes for AuditLog collection...');
    await MongoAuditLog.init();
    await MongoAuditLog.syncIndexes();
    console.log('  ✔ AuditLog indexes synchronized (createdAt_-1, action_1_createdAt_-1)');

    // Seed Default Administrator Account
    console.log('[Init] Seeding default administrator account...');
    await seedDefaultAdmin();
    console.log('  ✔ Default administrator account verified');

    // Record initialization in AuditLog
    await logAdminAction({
      action: 'DATABASE_MAINTENANCE' as any,
      actor: {
        role: 'SYSTEM_MIGRATION',
        email: 'system@saferoute.internal',
      },
      target: {
        resourceType: 'System',
        resourceName: 'DatabaseInitialization',
      },
      status: 'SUCCESS',
      metadata: {
        timestamp: new Date().toISOString(),
        database: health.databaseName,
        status: 'Indexes synchronized successfully',
      },
    });

    console.log('\n[Init] Database initialization completed successfully!');
    console.log('========================================================================');
  } catch (error) {
    console.error('[Init] Database initialization failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

if (require.main === module || process.argv[1]?.includes('initDatabase')) {
  initDatabase();
}

export { initDatabase };
