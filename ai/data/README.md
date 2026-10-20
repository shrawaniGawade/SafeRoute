# SafeRoute Data Catalog & Geospatial Data Documentation

| Metadata | Specification |
|---|---|
| **Primary Demo City** | **Chicago, Illinois, USA** |
| **Geographic Boundary (WGS84)** | Lat: `41.644` to `42.023` · Lon: `-87.940` to `-87.524` |
| **Data License** | City of Chicago Open Data License / Public Domain & ODbL (OpenStreetMap) |
| **Primary Crime Dataset** | Chicago Police Department — Crimes 2024 (Point-level incident logs) |
| **Primary Crash Dataset** | City of Chicago — Traffic Crashes (Point-level collisions) |
| **Infrastructure Layer** | OpenStreetMap (OSM) Road Lighting (`lit`) & Emergency Services POIs |
| **Validated Sample Seed** | `ai/data/sample/chicago_incidents_sample.csv` (1,500 validated rows, 100% geocoded) |
| **Validation Utility** | `python ai/data/validate_dataset.py` |

---

## 1. Selected Demo City & Justification

SafeRoute evaluates route safety using multi-factor environmental and historical risk indicators. Choosing a city with granular, high-integrity open data is paramount to generating explainable safety scores.

### Why Chicago, IL?
1. **True Point-Level Coordinates**: Unlike municipal portals that aggregate data into zip codes or wards, Chicago publishes precise latitude and longitude (WGS84 EPSG:4326) coordinates for every reported incident.
2. **Standardized Timestamps**: Incidents include precise dates, times of day, and shifts, enabling temporal risk modeling (e.g., night vs. daytime risk).
3. **High Volume & Continuous Updates**: With over 200,000 recorded crime incidents and 100,000+ traffic crashes annually, models can learn robust spatial-temporal patterns across seasons without data sparsity.
4. **Comprehensive Infrastructure Mapping**: Chicago has mature OpenStreetMap coverage for streetlights (`lit=yes/no`), emergency facilities (police stations, hospitals, fire stations), and transit hubs.

---

## 2. Primary Datasets Catalog

### 2.1 Dataset A: Chicago Police Department Reported Crimes
* **Source**: City of Chicago Open Data Portal
* **Official URL**: [City of Chicago Crimes - 2001 to Present](https://data.cityofchicago.org/Public-Safety/Crimes-2001-to-Present/ijzp-q8t2)
* **2024 Socrata Endpoint**: `https://data.cityofchicago.org/resource/ijzp-q8t2.json`
* **Licence**: City of Chicago Open Data Terms of Use (Permissive public domain / non-exclusive commercial and non-commercial reuse)
* **Time Period**: 2024-01-01 to 2024-12-31 (12 months full annual period)
* **Annual Row Count**: ~260,000 point-level records per year
* **Key Fields**:
  - `ID`: Unique integer identifier
  - `Case Number`: Chicago Police Department case report ID
  - `Date`: Timestamp of incident occurrence (MM/DD/YYYY hh:mm:ss AM/PM)
  - `Block`: Anonymized block address (e.g., `001XX N STATE ST`)
  - `IUCR`: Illinois Uniform Crime Reporting code
  - `Primary Type`: Primary statutory classification (e.g., `THEFT`, `BATTERY`, `ROBBERY`, `ASSAULT`)
  - `Description`: Secondary subcategory description
  - `Location Description`: Physical venue type (e.g., `STREET`, `SIDEWALK`, `ALLEY`, `CTA PLATFORM`)
  - `Arrest`: Boolean flag indicating whether an arrest was made
  - `Domestic`: Boolean flag indicating domestic altercation
  - `Beat` / `District` / `Ward`: Police geographic administrative zones
  - `FBI Code`: FBI crime classification code
  - `Latitude` & `Longitude`: High-precision WGS84 point coordinates

### 2.2 Dataset B: Chicago Traffic Crashes (Collisions)
* **Source**: City of Chicago Department of Transportation (CDOT)
* **Official URL**: [Traffic Crashes - Crashes](https://data.cityofchicago.org/Transportation/Traffic-Crashes-Crashes/85ca-t3if)
* **API Endpoint**: `https://data.cityofchicago.org/resource/85ca-t3if.json`
* **Licence**: City of Chicago Open Data Terms of Use
* **Time Period**: Rolling 12–24 months
* **Annual Row Count**: ~110,000 collision incidents per year
* **Key Fields**:
  - `CRASH_RECORD_ID`: Unique crash identifier
  - `CRASH_DATE`: Timestamp of collision
  - `POSTED_SPEED_LIMIT`: Regulatory speed limit (mph)
  - `WEATHER_CONDITION`: Weather environment (Clear, Rain, Snow, Fog)
  - `LIGHTING_CONDITION`: Ambient lighting (Daylight, Dark - Lighted, Dark - Unlighted, Dusk, Dawn)
  - `FIRST_CRASH_TYPE`: Collision taxonomy (Rear End, Pedestrian, Angle, Sideswipe)
  - `INJURIES_TOTAL`: Total injured persons count
  - `LATITUDE` & `LONGITUDE`: WGS84 coordinates of collision impact

### 2.3 Dataset C: OpenStreetMap Infrastructure & POIs
* **Source**: OpenStreetMap contributors via Overpass API / Geofabrik Illinois Extract
* **Licence**: Open Database License (ODbL) 1.0
* **Layers Extracted**:
  1. **Street Lighting (`lit`)**:
     - `lit=yes` / `lit=no` / `lit=24/7` on highway ways
     - Used to calculate the street lighting ratio per spatial grid cell (0.0 to 10.0 scale)
  2. **Emergency Safe Havens**:
     - `amenity=police`: Chicago Police District Headquarters and precinct stations
     - `amenity=hospital`: Trauma centers and emergency medical rooms
     - `amenity=fire_station`: City firehouses and paramedic bases
     - `amenity=pharmacy`: 24-hour illuminated facilities
  3. **Pedestrian Activity Indicators**:
     - `highway=bus_stop`: CTA bus stops
     - `railway=station`: CTA 'L' rapid transit train stations

---

## 3. Candidate Dataset Evaluation Matrix

| Dataset Candidate | Type | Spatial Granularity | Temporal Resolution | Usability for Route Scoring | Selection Decision |
|---|---|---|---|---|---|
| **Chicago Open Data Portal (Crimes + Crashes)** | Crime & Crash | Point-level (Lat/Lon) | Exact date + minute | **Optimal**: High accuracy, rich attributes, consistent city boundaries | **Selected (Primary Demo City)** |
| **UK police.uk Street-Level Crimes** | Crime | Anonymized point | Month only (no hour) | Good, but lacks hour/minute granularity needed for night travel risk | Evaluated; Secondary alternative |
| **UK STATS19 Road Safety Data** | Accidents | Point-level (Lat/Lon) | Exact date + minute | Strong crash data, but must be paired with crime data | Evaluated |
| **NYC Open Data (Collisions & NYPD)** | Crime & Crash | Point-level (Lat/Lon) | Exact date + minute | Excellent quality, but large file size (>1.5 GB raw) | Evaluated; Viable backup |
| **India NCRB / data.gov.in** | Crime | District / State level | Annual totals only | **Unsuitable for micro-routing**: District-wide totals cannot score individual street segments | Rejected for route scoring; used for macro context only |

---

## 4. Directory Structure & File Governance

```
ai/data/
├── README.md                              # This document: provenance, license, schema, and fallback rules
├── generate_seed.py                       # Deterministic seed generator for reproducible development
├── validate_dataset.py                    # Automated dataset verification script (lat/lon, dates, ranges)
├── raw/                                   # Downloaded raw CSV / JSON dumps (strictly git-ignored)
│   ├── .gitignore                         # Ignores large downloaded datasets
│   └── .gitkeep                           # Preserves folder structure in version control
└── sample/                                # Version-controlled clean reference datasets
    └── chicago_incidents_sample.csv       # 1,500 validated records with coordinates and ISO timestamps
```

> **Git Safety Rule**: All raw data files downloaded into `ai/data/raw/` are excluded from version control via `ai/data/raw/.gitignore` and `ai/.gitignore` to maintain a lightweight repository.

---

## 5. Seed Dataset Schema (`ai/data/sample/chicago_incidents_sample.csv`)

| Field | Type | Nullable | Example | Description |
|---|---|---|---|---|
| `incident_id` | String | No | `CHI-2024-00104` | Unique canonical identifier for the incident |
| `timestamp` | String (ISO-8601) | No | `2024-06-14T21:45:00Z` | Standardized UTC timestamp of incident |
| `year` | Integer | No | `2024` | Calendar year |
| `month` | Integer | No | `6` | Calendar month (1–12) |
| `hour` | Integer | No | `21` | Hour of incident in 24h format (0–23) |
| `day_of_week` | String | No | `Friday` | Weekday name |
| `latitude` | Float (WGS84) | No | `41.881900` | Incident latitude coordinate |
| `longitude` | Float (WGS84) | No | `-87.627800` | Incident longitude coordinate |
| `neighborhood` | String | No | `The Loop` | Neighborhood name |
| `incident_type` | String | No | `BATTERY` | Specific incident taxonomy |
| `category` | String | No | `CRIME` / `CRASH` | High-level risk category |
| `location_description` | String | No | `SIDEWALK` | Specific physical context |
| `lighting_condition` | String | No | `DARK_LIT` | Ambient lighting condition at scene |
| `severity_score` | Float | No | `6.80` | Normalized risk weight (0.00 to 10.00 scale) |
| `arrest` | Boolean | No | `False` | Whether suspect was apprehended |
| `police_proximity_m` | Float | No | `342.5` | Haversine distance in meters to nearest CPD station |
| `hospital_proximity_m` | Float | No | `618.2` | Haversine distance in meters to nearest hospital ED |
| `is_simulated` | Boolean | No | `False` | Provenance flag distinguishing verified vs synthetic rows |
| `data_source` | String | No | `City of Chicago...` | Attribution text for audit compliance |

---

## 6. Dataset Quality & Validation Rules

The `ai/data/validate_dataset.py` utility enforces the following strict acceptance tests:
1. **Mandatory Point Coordinates**: Every single row must have a non-null, valid numeric `latitude` and `longitude`.
2. **City Bounding Box Check**: Coordinates must fall within the defined city perimeter (`41.60` to `42.10` Lat, `-87.95` to `-87.50` Lon).
3. **ISO-8601 Timestamps**: Every row must have a valid calendar timestamp that parses without ambiguity.
4. **Severity Bounding**: The `severity_score` must fall strictly within `[0.0, 10.0]`.
5. **Zero Missing / NaN Fields**: Rows with corrupted or blank values in critical fields are rejected.

### Running Dataset Validation
```bash
# Validate the default sample seed
python ai/data/validate_dataset.py

# Validate any raw or custom dataset
python ai/data/validate_dataset.py --file ai/data/raw/Crimes_2024.csv
```

---

## 7. Fallback Policy & Transparent Simulation Labeling

In production, user queries may originate from regions where point-level municipal police logs are not published (e.g., regions with coarse district totals or areas outside Chicago during open testing).

SafeRoute guarantees safe, transparent operation using a 3-tier fallback architecture:

```
[User Query]
     │
     ▼
[Within Chicago Bounding Box?]
     ├── YES ──► Use trained Chicago ML weights & validated incident grid
     │
     └── NO  ──► Check OpenStreetMap coverage for queried region:
                   │
                   ├── OSM Infrastructure available ──► Calculate real OSM lighting & POI proximity;
                   │                                     Blend with baseline heuristic engine;
                   │                                     Mark response with "data_type": "osm_heuristic"
                   │
                   └── Sparse / Offline ──────────────► Fallback to synthetic demonstration seed;
                                                         Explicitly label response:
                                                         • "data_type": "simulated_seed"
                                                         • "warning": "Demonstration only. Not validated for real-world emergency dispatch."
```

### UI and API Transparency Guarantees
- The API response model (`/predict` and `/predict-route`) explicitly returns `data_type` and `warning` attributes.
- The SafeRoute web UI prominently displays badge indicators identifying whether route evaluation was derived from:
  1. `Verified City Open Data` (Green badge)
  2. `OSM Infrastructure Layer` (Blue badge)
  3. `Demonstration Simulation Mode` (Amber badge with advisory notice)
- At no point does the application present simulated fallback data as genuine law-enforcement records.
