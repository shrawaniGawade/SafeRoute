# ISSUE-13: Safety Score Engine

| Field | Value |
|---|---|
| **Phase / Day** | Phase 5 · Day 5 |
| **Priority** | Must have |
| **Labels** | `safety`, `backend`, `core` |
| **Status** | ✅ Completed |
| **Depends on** | ISSUE-10, ISSUE-12 |
| **Requirements** | FR-4.1 – FR-4.9 · FRD F3.1, F3.2 |

## What is this?
This is the **main feature** of SafeRoute. Each route gets a Safety Score from 0 to 100, built from 6 factors:

| Factor | Weight |
|---|:---:|
| Lighting | 25% |
| Crime | 25% |
| Accident | 20% |
| Activity | 10% |
| Time of day | 10% |
| Emergency nearby | 10% |

**Formula:** `Score = (each factor score × its weight), added together`

If data is missing, the app says **"unknown"** and never assumes the route is safe.

## User Story
**As a** user,
**I want** each route to have a Safety Score,
**so that** I can compare how safe the routes are, not just how fast.

## Workflow
1. The backend gets the routes.
2. For each route, it picks points about every 200 m.
3. For each point, it finds safety data within 250 m.
4. It calculates a 0–100 score for each factor.
5. It multiplies each score by its weight and adds them up to get the Safety Score.
6. It checks coverage (how much real data was found):
   - 60% or more → show the score and a risk level (Low, Moderate, High)
   - less than 60% → show **"Insufficient data"**

## Tasks
- [x] `services/safetyScore.service.ts`
- [x] Sample points along the route (`@turf/along`)
- [x] Find nearby records for each factor (`$geoNear`)
- [x] Normalize each factor to 0–100 (higher means better)
- [x] Time rules: day 100, evening 70, night 40
- [x] Weighted sum, with missing weight spread across the other factors
- [x] Coverage %, risk level, and data freshness
- [x] Unit tests (Node.js test runner): formula, missing data, threshold

## Acceptance Criteria
- [x] **Given** the factors (90, 88, 92, 80, 95, 85), **then** the score is **88.9** and the risk is **Low**.
- [x] **Given** only 50% data coverage, **then** the result is "Insufficient data".
- [x] **Given** a night departure, **then** the time factor is lower than for a day departure.
- [x] **Given** the weights, **then** they always total 100%.

## Technical Notes
- Risk levels: ≥75 Low · 50–74 Moderate · <50 High
- The scoring engine must reach at least 80% unit-test coverage

