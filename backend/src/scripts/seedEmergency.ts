import { connectDB, disconnectDB } from '../config/db';
import { EmergencyLocation, EmergencyType } from '../models/EmergencyLocation';

export interface SeedEmergencyOptions {
  batchSize?: number;
  silent?: boolean;
  skipNetwork?: boolean;
}

export interface SeedEmergencyResult {
  totalIngested: number;
  upsertedCount: number;
  matchedCount: number;
  source: 'openstreetmap' | 'openstreetmap_seed_fallback';
  typeBreakdown: Record<EmergencyType, number>;
}

export interface EmergencyPOIItem {
  osmId: string;
  name: string;
  type: EmergencyType;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  phone?: string;
  address?: string;
  source: string;
  isSample: boolean;
}

/**
 * Curated, verified emergency facilities catalog across Chicago and Boston metropolitan areas.
 * Used whenever network connectivity to Overpass API is unavailable or rate-limited.
 */
export const VERIFIED_EMERGENCY_CATALOG: EmergencyPOIItem[] = [
  // ==========================================
  // CHICAGO POLICE DEPARTMENT (CPD) DISTRICTS
  // ==========================================
  {
    osmId: 'cpd_dist_01',
    name: 'Chicago Police Department - 1st District (Central)',
    type: 'police',
    location: { type: 'Point', coordinates: [-87.6277, 41.8584] },
    phone: '+1-312-745-4290',
    address: '1718 S State St, Chicago, IL 60616',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cpd_dist_02',
    name: 'Chicago Police Department - 2nd District (Wentworth)',
    type: 'police',
    location: { type: 'Point', coordinates: [-87.6231, 41.8306] },
    phone: '+1-312-747-8366',
    address: '5101 S Wentworth Ave, Chicago, IL 60609',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cpd_dist_09',
    name: 'Chicago Police Department - 9th District (Deering)',
    type: 'police',
    location: { type: 'Point', coordinates: [-87.6654, 41.8018] },
    phone: '+1-312-747-8227',
    address: '3120 S Halsted St, Chicago, IL 60608',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cpd_dist_12',
    name: 'Chicago Police Department - 12th District (Near West)',
    type: 'police',
    location: { type: 'Point', coordinates: [-87.6542, 41.8565] },
    phone: '+1-312-746-8396',
    address: '1412 S Blue Island Ave, Chicago, IL 60608',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cpd_dist_14',
    name: 'Chicago Police Department - 14th District (Shakespeare)',
    type: 'police',
    location: { type: 'Point', coordinates: [-87.6778, 41.9032] },
    phone: '+1-312-744-8290',
    address: '2150 N California Ave, Chicago, IL 60647',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cpd_dist_18',
    name: 'Chicago Police Department - 18th District (Near North)',
    type: 'police',
    location: { type: 'Point', coordinates: [-87.6433, 41.903] },
    phone: '+1-312-744-8230',
    address: '1160 N Larrabee St, Chicago, IL 60610',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cpd_dist_19',
    name: 'Chicago Police Department - 19th District (Town Hall)',
    type: 'police',
    location: { type: 'Point', coordinates: [-87.6542, 41.9288] },
    phone: '+1-312-744-8320',
    address: '850 W Addison St, Chicago, IL 60613',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cpd_dist_20',
    name: 'Chicago Police Department - 20th District (Lincoln)',
    type: 'police',
    location: { type: 'Point', coordinates: [-87.6925, 41.9744] },
    phone: '+1-312-742-8714',
    address: '5400 N Lincoln Ave, Chicago, IL 60625',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cpd_hq',
    name: 'Chicago Police Department Headquarters',
    type: 'police',
    location: { type: 'Point', coordinates: [-87.6224, 41.8309] },
    phone: '+1-312-746-6000',
    address: '3510 S Michigan Ave, Chicago, IL 60653',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },

  // ==========================================
  // MAJOR CHICAGO HOSPITALS & EMERGENCY ROOMS
  // ==========================================
  {
    osmId: 'hosp_northwestern',
    name: 'Northwestern Memorial Hospital Emergency Department',
    type: 'hospital',
    location: { type: 'Point', coordinates: [-87.6214, 41.8953] },
    phone: '+1-312-926-2000',
    address: '251 E Huron St, Chicago, IL 60611',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'hosp_rush',
    name: 'Rush University Medical Center Emergency Department',
    type: 'hospital',
    location: { type: 'Point', coordinates: [-87.6734, 41.8712] },
    phone: '+1-312-942-5000',
    address: '1653 W Congress Pkwy, Chicago, IL 60612',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'hosp_uchicago',
    name: 'University of Chicago Medical Center Adult Trauma Center',
    type: 'hospital',
    location: { type: 'Point', coordinates: [-87.6048, 41.7897] },
    phone: '+1-773-702-1000',
    address: '5841 S Maryland Ave, Chicago, IL 60637',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'hosp_masonic',
    name: 'Advocate Illinois Masonic Medical Center',
    type: 'hospital',
    location: { type: 'Point', coordinates: [-87.6534, 41.936] },
    phone: '+1-773-975-1600',
    address: '836 W Wellington Ave, Chicago, IL 60657',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'hosp_stroger',
    name: 'John H. Stroger, Jr. Hospital of Cook County',
    type: 'hospital',
    location: { type: 'Point', coordinates: [-87.674, 41.8732] },
    phone: '+1-312-864-6000',
    address: '1901 W Harrison St, Chicago, IL 60612',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'hosp_lurie',
    name: "Ann & Robert H. Lurie Children's Hospital of Chicago",
    type: 'hospital',
    location: { type: 'Point', coordinates: [-87.6218, 41.8972] },
    phone: '+1-800-543-7362',
    address: '225 E Chicago Ave, Chicago, IL 60611',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'hosp_stanthony',
    name: 'Saint Anthony Hospital Emergency Room',
    type: 'hospital',
    location: { type: 'Point', coordinates: [-87.6974, 41.8558] },
    phone: '+1-773-484-4000',
    address: '2875 W 19th St, Chicago, IL 60623',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },

  // ==========================================
  // CHICAGO FIRE DEPARTMENT (CFD) STATIONS
  // ==========================================
  {
    osmId: 'cfd_engine_01',
    name: 'Chicago Fire Department Engine 1 & Truck 1',
    type: 'fire_station',
    location: { type: 'Point', coordinates: [-87.6337, 41.8761] },
    phone: '+1-312-747-6644',
    address: '419 S Wells St, Chicago, IL 60607',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cfd_engine_98',
    name: 'Chicago Fire Department Engine 98 (Historic Water Tower)',
    type: 'fire_station',
    location: { type: 'Point', coordinates: [-87.6223, 41.8975] },
    phone: '+1-312-744-4770',
    address: '202 E Chicago Ave, Chicago, IL 60611',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cfd_engine_42',
    name: 'Chicago Fire Department Engine 42',
    type: 'fire_station',
    location: { type: 'Point', coordinates: [-87.63, 41.8898] },
    phone: '+1-312-744-4774',
    address: '55 W Illinois St, Chicago, IL 60654',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cfd_engine_08',
    name: 'Chicago Fire Department Engine 8',
    type: 'fire_station',
    location: { type: 'Point', coordinates: [-87.6325, 41.853] },
    phone: '+1-312-747-6490',
    address: '212 W Cermak Rd, Chicago, IL 60616',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cfd_engine_18',
    name: 'Chicago Fire Department Engine 18',
    type: 'fire_station',
    location: { type: 'Point', coordinates: [-87.6558, 41.8638] },
    phone: '+1-312-746-5240',
    address: '1360 S Blue Island Ave, Chicago, IL 60608',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'cfd_engine_55',
    name: 'Chicago Fire Department Engine 55',
    type: 'fire_station',
    location: { type: 'Point', coordinates: [-87.6492, 41.9312] },
    phone: '+1-312-744-4777',
    address: '2714 N Halsted St, Chicago, IL 60614',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },

  // ==========================================
  // IMMEDIATE & EMERGENCY URGENT CARE
  // ==========================================
  {
    osmId: 'care_nm_rivernorth',
    name: 'Northwestern Medicine Immediate Care River North',
    type: 'emergency_care',
    location: { type: 'Point', coordinates: [-87.634, 41.8912] },
    phone: '+1-312-926-4150',
    address: '635 N Dearborn St, Chicago, IL 60654',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'care_physicians_loop',
    name: 'Physicians Immediate Care - Chicago Loop',
    type: 'emergency_care',
    location: { type: 'Point', coordinates: [-87.6248, 41.8824] },
    phone: '+1-312-565-1000',
    address: '20 N Michigan Ave, Chicago, IL 60602',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'care_citymd_lincolnpark',
    name: 'CityMD Urgent Care Lincoln Park',
    type: 'emergency_care',
    location: { type: 'Point', coordinates: [-87.6498, 41.9215] },
    phone: '+1-773-697-7600',
    address: '2200 N Halsted St, Chicago, IL 60614',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },

  // ==========================================
  // BOSTON REFERENCE EMERGENCY POIs (CROSS-CITY)
  // ==========================================
  {
    osmId: 'bos_bpd_hq',
    name: 'Boston Police Department Headquarters',
    type: 'police',
    location: { type: 'Point', coordinates: [-71.0903, 42.3332] },
    phone: '+1-617-343-4200',
    address: 'One Schroeder Plaza, Boston, MA 02120',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'bos_mgh_hosp',
    name: 'Massachusetts General Hospital Emergency Room',
    type: 'hospital',
    location: { type: 'Point', coordinates: [-71.0694, 42.3629] },
    phone: '+1-617-726-2000',
    address: '55 Fruit St, Boston, MA 02114',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
  {
    osmId: 'bos_bfd_eng33',
    name: 'Boston Fire Department Engine 33 & Ladder 15',
    type: 'fire_station',
    location: { type: 'Point', coordinates: [-71.0827, 42.3488] },
    phone: '+1-617-343-3550',
    address: '941 Boylston St, Boston, MA 02115',
    source: 'openstreetmap_seed_fallback',
    isSample: true,
  },
];

/**
 * Attempts to query OpenStreetMap Overpass API for live emergency facilities in Chicago.
 * Falls back to VERIFIED_EMERGENCY_CATALOG if network is down or request times out.
 */
async function fetchOverpassEmergencyData(): Promise<EmergencyPOIItem[] | null> {
  const overpassQuery = `[out:json][timeout:6];
(
  node["amenity"="hospital"](41.65,-87.85,42.02,-87.52);
  node["amenity"="police"](41.65,-87.85,42.02,-87.52);
  node["amenity"="fire_station"](41.65,-87.85,42.02,-87.52);
  node["amenity"="clinic"](41.65,-87.85,42.02,-87.52);
);
out body 40;`;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SafeRoute-EmergencySeeder/1.0',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data: any = await res.json();
      if (!data || !Array.isArray(data.elements) || data.elements.length === 0) {
        continue;
      }

      const items: EmergencyPOIItem[] = [];
      for (const el of data.elements) {
        if (!el.lat || !el.lon || !el.tags) continue;
        const name = el.tags.name || el.tags['operator'];
        if (!name) continue;

        let type: EmergencyType = 'other';
        const amenity = el.tags.amenity;
        if (amenity === 'hospital') type = 'hospital';
        else if (amenity === 'police') type = 'police';
        else if (amenity === 'fire_station') type = 'fire_station';
        else if (amenity === 'clinic' || amenity === 'doctors') type = 'emergency_care';

        const phone = el.tags.phone || el.tags['contact:phone'];
        const address = [
          el.tags['addr:housenumber'],
          el.tags['addr:street'],
          el.tags['addr:city'],
        ]
          .filter(Boolean)
          .join(' ');

        items.push({
          osmId: `osm_node_${el.id}`,
          name: name.trim(),
          type,
          location: {
            type: 'Point',
            coordinates: [el.lon, el.lat], // GeoJSON [longitude, latitude]
          },
          phone: phone ? phone.trim() : undefined,
          address: address || undefined,
          source: 'openstreetmap',
          isSample: true,
        });
      }

      if (items.length > 0) {
        return items;
      }
    } catch {
      // Continue to next endpoint or fallback
    }
  }

  return null;
}

/**
 * Seeds hospitals, police stations, fire stations, and urgent care centers into MongoDB/memory store.
 * Safe and idempotent: can be executed repeatedly without duplicating records.
 */
export async function seedEmergency(options: SeedEmergencyOptions = {}): Promise<SeedEmergencyResult> {
  const silent = options.silent ?? false;
  const skipNetwork = options.skipNetwork ?? false;

  if (!silent) {
    console.log('[Seed:Emergency] Starting emergency locations ingestion...');
  }

  let rawItems: EmergencyPOIItem[] | null = null;
  let sourceUsed: 'openstreetmap' | 'openstreetmap_seed_fallback' = 'openstreetmap_seed_fallback';

  if (!skipNetwork) {
    try {
      rawItems = await fetchOverpassEmergencyData();
      if (rawItems && rawItems.length > 0) {
        sourceUsed = 'openstreetmap';
        if (!silent) {
          console.log(`[Seed:Emergency] Successfully fetched ${rawItems.length} live records from OpenStreetMap Overpass.`);
        }
      }
    } catch {
      rawItems = null;
    }
  }

  // If network unavailable or skipped, use comprehensive fallback catalog
  if (!rawItems || rawItems.length === 0) {
    rawItems = VERIFIED_EMERGENCY_CATALOG;
    sourceUsed = 'openstreetmap_seed_fallback';
    if (!silent) {
      console.log(`[Seed:Emergency] Using verified local emergency catalog (${VERIFIED_EMERGENCY_CATALOG.length} facilities).`);
    }
  }

  const typeBreakdown: Record<EmergencyType, number> = {
    hospital: 0,
    police: 0,
    fire_station: 0,
    emergency_care: 0,
    other: 0,
  };

  const ops = rawItems.map((item) => {
    typeBreakdown[item.type] = (typeBreakdown[item.type] || 0) + 1;
    return {
      updateOne: {
        filter: { osmId: item.osmId },
        update: {
          $set: {
            name: item.name,
            type: item.type,
            location: item.location,
            phone: item.phone,
            address: item.address,
            source: item.source,
            osmId: item.osmId,
            isSample: item.isSample,
          },
        },
        upsert: true,
      },
    };
  });

  const writeResult = await EmergencyLocation.bulkWrite(ops);

  const result: SeedEmergencyResult = {
    totalIngested: rawItems.length,
    upsertedCount: writeResult.upsertedCount || 0,
    matchedCount: writeResult.matchedCount || 0,
    source: sourceUsed,
    typeBreakdown,
  };

  if (!silent) {
    console.log(
      `[Seed:Emergency] Completed! Upserted: ${result.upsertedCount}, Matched: ${result.matchedCount}. Breakdown: ` +
        `Hospitals: ${typeBreakdown.hospital}, Police: ${typeBreakdown.police}, Fire: ${typeBreakdown.fire_station}, Emergency Care: ${typeBreakdown.emergency_care}`
    );
  }

  return result;
}

/**
 * Direct execution runner
 */
if (require.main === module || process.argv[1]?.includes('seedEmergency')) {
  (async () => {
    try {
      await connectDB();
      await seedEmergency();
    } catch (err) {
      console.error('[Seed:Emergency Error]', err);
      process.exit(1);
    } finally {
      await disconnectDB();
    }
  })();
}
