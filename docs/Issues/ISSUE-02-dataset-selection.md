# ISSUE-02: Select and Document Datasets

| Field | Value |
|---|---|
| **Phase / Day** | Phase 1 · Day 1 |
| **Priority** | Must have |
| **Labels** | `data`, `ai-ml`, `research` |
| **Status** | ✅ Done |
| **Depends on** | — |
| **Requirements** | ML-01, BRD §12.2 |

## What is this?
SafeRoute needs real data (crime, accidents, lighting, emergency places) to calculate safety. Finding good data is the **biggest risk** in the project, so the data is chosen on Day 1, before any scoring or ML work starts.

## User Story
**As a** developer,
**I want** to choose and document a reliable dataset early,
**so that** the safety score and ML model are based on real, explainable data.

## Workflow
1. Choose one demo city.
2. Search for open datasets that have **location (lat/lng) + date/time** for each incident.
3. Check each dataset's licence, size, and time period.
4. Download the data and write down where it came from.
5. Decide which data is real and which is sample data (sample data is labelled in the app).

## Tasks
- [x] Choose the demo city (for example Chicago, or an Indian city with OSM data only)
- [x] Pick a crime or incident dataset (point level, at least 12 months, at least 10,000 rows)
- [x] Pick an accident dataset (same city if possible)
- [x] Plan the OSM data: `lit` tags, POIs, hospitals, police, fire stations
- [x] Save the raw files to `ai/data/raw/` (git-ignored)
- [x] Write `ai/data/README.md`: source, link, licence, period, row count
- [x] Decide the fallback: if no good data is found, use sample data and label it clearly

## Acceptance Criteria
- [x] **Given** the chosen dataset, **when** I open `ai/data/README.md`, **then** I can see its source, licence, and period.
- [x] **Given** the dataset, **when** I load it, **then** every row has coordinates and a date.
- [x] **Given** no suitable dataset exists, **then** the fallback (sample data with labels) is written down.

## Technical Notes
- Candidates: Chicago Crimes, UK police.uk, UK STATS19, NYC Collisions
- India NCRB data is per district only, which is too coarse for scoring routes
- See [AI_IMPLEMENTATION01 §5](../AI_IMPLEMENTATION01.md#5-dataset-selection)
