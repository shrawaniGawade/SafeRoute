import fs from 'fs';
import path from 'path';
import { connectDB, disconnectDB } from '../config/db';
import { SafetyRecord } from '../models/SafetyRecord';

export interface SeedSafetyOptions {
  csvFilePath?: string;
  batchSize?: number;
  silent?: boolean;
}

export interface SeedSafetyResult {
  totalParsed: number;
  totalUpserted: number;
  totalMatched: number;
  totalModified: number;
  lightingRecordsCount: number;
  incidentRecordsCount: number;
}

/**
 * Standard Chicago & Boston major transit & commercial corridors for streetlighting safety data.
 */
const LIGHTING_CORRIDORS: Array<{
  id: string;
  name: string;
  coords: [number, number]; // [lon, lat]
  value: number; // 0 - 100 lighting score
  quality: string;
}> = [
  // Chicago - Loop & River North (High illumination)
  { id: 'LIGHT-CHI-001', name: 'Michigan Avenue / Magnificent Mile', coords: [-87.6244, 41.8924], value: 92, quality: 'well_lit' },
  { id: 'LIGHT-CHI-002', name: 'State Street Commercial Corridor', coords: [-87.6278, 41.8821], value: 88, quality: 'well_lit' },
  { id: 'LIGHT-CHI-003', name: 'Wacker Drive Riverwalk Corridor', coords: [-87.6288, 41.8872], value: 90, quality: 'well_lit' },
  { id: 'LIGHT-CHI-004', name: 'Clark Street Dining Corridor', coords: [-87.6315, 41.8906], value: 85, quality: 'well_lit' },
  { id: 'LIGHT-CHI-005', name: 'Dearborn Street Transit Corridor', coords: [-87.6293, 41.8805], value: 84, quality: 'well_lit' },
  { id: 'LIGHT-CHI-006', name: 'Randolph Street Theater District', coords: [-87.6322, 41.8845], value: 87, quality: 'well_lit' },
  { id: 'LIGHT-CHI-007', name: 'Madison Street Financial Spine', coords: [-87.6350, 41.8820], value: 86, quality: 'well_lit' },
  { id: 'LIGHT-CHI-008', name: 'Grand Avenue River North Spine', coords: [-87.6345, 41.8918], value: 82, quality: 'well_lit' },
  
  // Chicago - West Loop & Fulton Market (Active evening corridors)
  { id: 'LIGHT-CHI-009', name: 'Fulton Market Historic District', coords: [-87.6495, 41.8867], value: 85, quality: 'well_lit' },
  { id: 'LIGHT-CHI-010', name: 'Halsted & Randolph Corridor', coords: [-87.6472, 41.8844], value: 81, quality: 'well_lit' },
  { id: 'LIGHT-CHI-011', name: 'Morgan & Lake Green Line Area', coords: [-87.6521, 41.8858], value: 78, quality: 'moderate' },
  { id: 'LIGHT-CHI-012', name: 'Ogden & Lake Junction', coords: [-87.6620, 41.8855], value: 72, quality: 'moderate' },

  // Chicago - Lincoln Park & Lakeview (Residential & nightlife corridors)
  { id: 'LIGHT-CHI-013', name: 'Clark & Fullerton Hub', coords: [-87.6425, 41.9254], value: 82, quality: 'well_lit' },
  { id: 'LIGHT-CHI-014', name: 'Lincoln Avenue Arts Corridor', coords: [-87.6522, 41.9212], value: 79, quality: 'moderate' },
  { id: 'LIGHT-CHI-015', name: 'Halsted & Belmont Night Corridor', coords: [-87.6490, 41.9398], value: 84, quality: 'well_lit' },
  { id: 'LIGHT-CHI-016', name: 'Broadway & Diversey Retail Spine', coords: [-87.6441, 41.9326], value: 83, quality: 'well_lit' },
  { id: 'LIGHT-CHI-017', name: 'Armitage Avenue Historic District', coords: [-87.6534, 41.9182], value: 76, quality: 'moderate' },

  // Chicago - South Loop & Pilsen
  { id: 'LIGHT-CHI-018', name: 'Roosevelt Road Transit Hub', coords: [-87.6275, 41.8674], value: 85, quality: 'well_lit' },
  { id: 'LIGHT-CHI-019', name: 'Michigan Avenue South Corridor', coords: [-87.6241, 41.8601], value: 80, quality: 'well_lit' },
  { id: 'LIGHT-CHI-020', name: '18th Street Pilsen Cultural Spine', coords: [-87.6565, 41.8578], value: 75, quality: 'moderate' },
  { id: 'LIGHT-CHI-021', name: 'Cermak & Chinatown Red Line Hub', coords: [-87.6318, 41.8532], value: 83, quality: 'well_lit' },

  // Chicago - Logan Square & Wicker Park
  { id: 'LIGHT-CHI-022', name: 'Milwaukee Avenue Six Corners Wicker', coords: [-87.6775, 41.9103], value: 86, quality: 'well_lit' },
  { id: 'LIGHT-CHI-023', name: 'Damen & North Avenue Intersection', coords: [-87.6778, 41.9105], value: 84, quality: 'well_lit' },
  { id: 'LIGHT-CHI-024', name: 'Logan Square Monument Circle', coords: [-87.7082, 41.9288], value: 80, quality: 'well_lit' },
  { id: 'LIGHT-CHI-025', name: 'California Blue Line Corridor', coords: [-87.6972, 41.9228], value: 74, quality: 'moderate' },

  // Chicago - Hyde Park & South
  { id: 'LIGHT-CHI-026', name: '53rd Street Hyde Park Corridor', coords: [-87.5872, 41.7995], value: 82, quality: 'well_lit' },
  { id: 'LIGHT-CHI-027', name: '57th & University Campus Spine', coords: [-87.5982, 41.7915], value: 88, quality: 'well_lit' },
  { id: 'LIGHT-CHI-028', name: 'Cottage Grove & 55th Bus Corridor', coords: [-87.6062, 41.7948], value: 71, quality: 'moderate' },

  // Dim / Lower illumination sample zones (for route contrast testing)
  { id: 'LIGHT-CHI-029', name: 'Goose Island Industrial Alley', coords: [-87.6582, 41.9021], value: 38, quality: 'dim' },
  { id: 'LIGHT-CHI-030', name: 'Lower West Rail Corridor Sidewalk', coords: [-87.6680, 41.8510], value: 34, quality: 'dim' },
  { id: 'LIGHT-CHI-031', name: 'Near South Freight Spur Path', coords: [-87.6385, 41.8465], value: 40, quality: 'dim' },

  // Boston - Downtown & Back Bay reference lighting
  { id: 'LIGHT-BOS-001', name: 'Boylston Street Commercial Corridor', coords: [-71.0776, 42.3505], value: 89, quality: 'well_lit' },
  { id: 'LIGHT-BOS-002', name: 'Newbury Street Pedestrian Spine', coords: [-71.0825, 42.3498], value: 86, quality: 'well_lit' },
  { id: 'LIGHT-BOS-003', name: 'Tremont & Park Street Hub', coords: [-71.0628, 42.3565], value: 91, quality: 'well_lit' },
  { id: 'LIGHT-BOS-004', name: 'Cambridge Street Beacon Hill Corridor', coords: [-71.0665, 42.3610], value: 83, quality: 'well_lit' },
];

/**
 * Resolves the path to the sample CSV file across multiple execution contexts.
 */
function resolveCsvFilePath(customPath?: string): string | null {
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  const searchCandidates = [
    path.resolve(__dirname, '../../../ai/data/sample/chicago_incidents_sample.csv'),
    path.resolve(process.cwd(), '../ai/data/sample/chicago_incidents_sample.csv'),
    path.resolve(process.cwd(), 'ai/data/sample/chicago_incidents_sample.csv'),
    path.resolve(__dirname, '../../../../ai/data/sample/chicago_incidents_sample.csv'),
    path.resolve(__dirname, '../../ai/data/sample/chicago_incidents_sample.csv'),
  ];

  for (const candidate of searchCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Lightweight RFC-4180 CSV line parser supporting quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Seeds crime, accident, and streetlighting safety data into MongoDB/memory store.
 * Safe and idempotent: can be executed repeatedly without duplicating records.
 */
export async function seedSafetyData(options: SeedSafetyOptions = {}): Promise<SeedSafetyResult> {
  const silent = options.silent ?? false;
  const batchSize = options.batchSize ?? 500;

  if (!silent) {
    console.log('[Seed:Safety] Starting safety data ingestion...');
  }

  const csvPath = resolveCsvFilePath(options.csvFilePath);
  const incidentRecords: Array<{
    externalId: string;
    location: { type: 'Point'; coordinates: [number, number] };
    factor: 'crime' | 'accident';
    value: number;
    source: string;
    isSample: boolean;
    metadata: Record<string, any>;
  }> = [];

  if (csvPath) {
    if (!silent) {
      console.log(`[Seed:Safety] Loading Chicago incident CSV from: ${csvPath}`);
    }
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length > 1) {
      const headerLine = lines[0];
      const headers = parseCsvLine(headerLine);
      const colMap = new Map<string, number>();
      headers.forEach((h, idx) => colMap.set(h.toLowerCase().trim(), idx));

      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        if (row.length < headers.length) continue;

        const getVal = (col: string): string => {
          const idx = colMap.get(col);
          return idx !== undefined ? row[idx] || '' : '';
        };

        const incidentId = getVal('incident_id') || `CHI-INC-${i.toString().padStart(5, '0')}`;
        const lat = parseFloat(getVal('latitude'));
        const lon = parseFloat(getVal('longitude'));

        if (isNaN(lat) || isNaN(lon) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
          continue;
        }

        const category = getVal('category').toUpperCase();
        const factor: 'crime' | 'accident' = category === 'CRASH' ? 'accident' : 'crime';
        const rawSev = parseFloat(getVal('severity_score'));
        // Scale 0-10 severity score up to 0-100 range, clamped
        const score = isNaN(rawSev) ? 50 : Math.min(100, Math.max(0, Math.round(rawSev * 10)));

        const dataSource =
          getVal('data_source') || 'City of Chicago Open Data Portal & OpenStreetMap (Seed Sample)';
        const neighborhood = getVal('neighborhood');
        const incidentType = getVal('incident_type');
        const locDesc = getVal('location_description');
        const lightingCond = getVal('lighting_condition');
        const arrestStr = getVal('arrest').toLowerCase();
        const policeProx = parseFloat(getVal('police_proximity_m'));
        const hospProx = parseFloat(getVal('hospital_proximity_m'));
        const timestamp = getVal('timestamp');

        incidentRecords.push({
          externalId: incidentId,
          location: {
            type: 'Point',
            coordinates: [lon, lat], // GeoJSON [longitude, latitude]
          },
          factor,
          value: score,
          source: dataSource,
          isSample: true, // Sample seed dataset satisfies Acceptance Criteria
          metadata: {
            incidentType,
            category,
            locationDescription: locDesc,
            lightingCondition: lightingCond,
            arrest: arrestStr === 'true',
            policeProximityM: !isNaN(policeProx) ? policeProx : undefined,
            hospitalProximityM: !isNaN(hospProx) ? hospProx : undefined,
            neighborhood: neighborhood || undefined,
            originalTimestamp: timestamp || undefined,
          },
        });
      }
    }
  } else {
    if (!silent) {
      console.warn('[Seed:Safety] Warning: Incident CSV not found on disk. Proceeding with synthetic sample records.');
    }
    // Fallback seed records if CSV is absent in environment
    for (let i = 1; i <= 20; i++) {
      incidentRecords.push({
        externalId: `SAMPLE-CRIME-${i.toString().padStart(4, '0')}`,
        location: {
          type: 'Point',
          coordinates: [-87.6298 + (i % 5) * 0.005, 41.8781 + (i % 4) * 0.004],
        },
        factor: i % 3 === 0 ? 'accident' : 'crime',
        value: 40 + (i * 3) % 55,
        source: 'City of Chicago Open Data Portal (Seed Fallback)',
        isSample: true,
        metadata: { fallback: true },
      });
    }
  }

  // Streetlighting records
  const lightingRecords = LIGHTING_CORRIDORS.map((corridor) => ({
    externalId: corridor.id,
    location: {
      type: 'Point' as const,
      coordinates: corridor.coords, // [longitude, latitude]
    },
    factor: 'lighting' as const,
    value: corridor.value,
    source: 'City of Chicago Department of Transportation (CDOT) & OpenStreetMap',
    isSample: true,
    metadata: {
      corridorName: corridor.name,
      illuminationQuality: corridor.quality,
    },
  }));

  const allRecords = [...incidentRecords, ...lightingRecords];

  if (!silent) {
    console.log(
      `[Seed:Safety] Ingesting ${incidentRecords.length} incident records and ${lightingRecords.length} lighting corridors (${allRecords.length} total)...`
    );
  }

  let totalUpserted = 0;
  let totalMatched = 0;
  let totalModified = 0;

  // Process in idempotent batches using bulkWrite with upsert
  for (let offset = 0; offset < allRecords.length; offset += batchSize) {
    const chunk = allRecords.slice(offset, offset + batchSize);
    const ops = chunk.map((rec) => ({
      updateOne: {
        filter: { externalId: rec.externalId },
        update: {
          $set: {
            location: rec.location,
            factor: rec.factor,
            value: rec.value,
            source: rec.source,
            isSample: rec.isSample,
            externalId: rec.externalId,
            metadata: rec.metadata,
          },
        },
        upsert: true,
      },
    }));

    const result = await SafetyRecord.bulkWrite(ops);
    totalUpserted += result.upsertedCount || 0;
    totalMatched += result.matchedCount || 0;
    totalModified += result.modifiedCount || 0;
  }

  const finalResult: SeedSafetyResult = {
    totalParsed: allRecords.length,
    totalUpserted,
    totalMatched,
    totalModified,
    lightingRecordsCount: lightingRecords.length,
    incidentRecordsCount: incidentRecords.length,
  };

  if (!silent) {
    console.log(
      `[Seed:Safety] Completed! Upserted: ${totalUpserted}, Matched/Updated: ${totalMatched}/${totalModified}. Total safe records active.`
    );
  }

  return finalResult;
}

/**
 * Direct execution runner
 */
if (require.main === module || process.argv[1]?.includes('seedSafetyData')) {
  (async () => {
    try {
      await connectDB();
      await seedSafetyData();
    } catch (err) {
      console.error('[Seed:Safety Error]', err);
      process.exit(1);
    } finally {
      await disconnectDB();
    }
  })();
}
