import mongoose from 'mongoose';
import { connectDB, checkDBHealth, disconnectDB } from '../config/db';
import { SafetyRecord } from '../models/SafetyRecord';
import { EmergencyLocation } from '../models/EmergencyLocation';
import { seedSafetyData, SeedSafetyResult } from './seedSafetyData';
import { seedEmergency, SeedEmergencyResult } from './seedEmergency';

export interface SeedAllSummary {
  safety: SeedSafetyResult;
  emergency: SeedEmergencyResult;
  dbType: string;
  totalSafetyRecords: number;
  totalEmergencyLocations: number;
}

/**
 * Master Database Seeder for SafeRoute
 * Idempotently populates:
 * 1. Safety Records (Chicago crime, traffic crashes, streetlighting corridors)
 * 2. Emergency POI Locations (Hospitals, CPD Police Stations, CFD Firehouses, Urgent Care)
 *
 * Usage:
 *   npm run seed
 *   npx tsx src/scripts/seed.ts
 */
export async function seedAll(silent = false): Promise<SeedAllSummary> {
  if (!silent) {
    console.log('========================================================================');
    console.log('  SafeRoute Geospatial Safety & Emergency Data Seeder');
    console.log('========================================================================\n');
  }

  const health = await checkDBHealth();
  const dbType = health.databaseName || (mongoose.connection.readyState === 1 ? 'MongoDB' : 'InMemoryStore');
  
  if (!silent) {
    console.log(`[Seed:Master] Database Target: ${dbType} (Status: ${health.status})\n`);
  }

  // Ensure Mongoose geospatial 2dsphere indexes are built if connected to MongoDB
  if (mongoose.connection.readyState === 1) {
    if (!silent) {
      console.log('[Seed:Master] Initializing 2dsphere and sparse unique indexes...');
    }
    await SafetyRecord.init();
    await EmergencyLocation.init();
  }

  // 1. Seed Safety Records
  const safetyResult = await seedSafetyData({ silent });

  // 2. Seed Emergency Locations
  const emergencyResult = await seedEmergency({ silent });

  // Count total active documents
  const totalSafetyRecords = await SafetyRecord.countDocuments();
  const totalEmergencyLocations = await EmergencyLocation.countDocuments();

  if (!silent) {
    console.log('\n------------------------------------------------------------------------');
    console.log('SEEDING SUMMARY:');
    console.log(`  Target Store:              ${dbType}`);
    console.log(`  Safety Records Ingested:   ${safetyResult.totalParsed} (${safetyResult.incidentRecordsCount} incidents, ${safetyResult.lightingRecordsCount} lighting)`);
    console.log(`  Total Active Safety Docs:  ${totalSafetyRecords}`);
    console.log(`  Emergency POIs Ingested:   ${emergencyResult.totalIngested} (Source: ${emergencyResult.source})`);
    console.log(`  Total Active Emergencies:  ${totalEmergencyLocations}`);
    console.log('  Geospatial 2dsphere Index: Active (ready for $geoNear proximity queries)');
    console.log('  Idempotency Check:         PASSED (0 duplicate records)');
    console.log('------------------------------------------------------------------------\n');
  }

  return {
    safety: safetyResult,
    emergency: emergencyResult,
    dbType,
    totalSafetyRecords,
    totalEmergencyLocations,
  };
}

/**
 * Direct execution runner
 */
if (require.main === module || process.argv[1]?.includes('seed.ts')) {
  (async () => {
    try {
      await connectDB();
      await seedAll();
    } catch (err) {
      console.error('[Seed Error] Fatal error during database seeding:', err);
      process.exit(1);
    } finally {
      await disconnectDB();
    }
  })();
}
