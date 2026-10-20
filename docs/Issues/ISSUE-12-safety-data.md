# ISSUE-12: Safety Data Models and Seed Data

| Field | Value |
|---|---|
| **Phase / Day** | Phase 5 · Day 5 |
| **Priority** | Must have |
| **Labels** | `data`, `backend`, `database` |
| **Status** | ✅ Completed |
| **Depends on** | ISSUE-02 |
| **Requirements** | BRD §12, SRS §6 |

## What is this?
The safety score needs data saved in the database: where crimes and accidents happened, which roads are lit, and where hospitals and police stations are. This issue creates the database tables (collections) and loads the data into them.

## User Story
**As a** developer,
**I want** safety and emergency data stored with locations,
**so that** the app can find which data is near each route.

## Workflow
1. A seed script reads the downloaded data files.
2. It cleans each record and saves it with a location (GeoJSON).
3. Emergency places are loaded from OpenStreetMap.
4. Simulated records are marked `isSample: true`.
5. The database can now answer queries like "find records within 250 m of this point".

## Tasks
- [x] `models/SafetyRecord.ts`: `location, factor, value (0–100), source, isSample, updatedAt`
- [x] `models/EmergencyLocation.ts`: `name, type, location, phone?, source`
- [x] Add `2dsphere` indexes on `location`
- [x] `scripts/seedSafetyData.ts`: import crime, accident, and lighting data
- [x] `scripts/seedEmergency.ts`: import hospitals, police, and fire stations from Overpass
- [x] Add an npm script: `npm run seed`

## Acceptance Criteria
- [x] **Given** I run `npm run seed`, **then** the records appear in MongoDB.
- [x] **Given** a point, **when** I run a `$geoNear` query, **then** nearby records are returned.
- [x] **Given** simulated data, **then** it has `isSample: true`.

## Technical Notes
- GeoJSON coordinates use **[longitude, latitude]** order
- The seed script must be safe to run more than once (upsert, no duplicates)

