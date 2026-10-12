# ISSUE-18: Safety Analysis UI

| Field | Value |
|---|---|
| **Phase / Day** | Phase 8 · Day 8 |
| **Priority** | Must have |
| **Labels** | `safety`, `frontend`, `ux` |
| **Status** | ⬜ Not started |
| **Depends on** | ISSUE-14, ISSUE-17 |
| **Requirements** | FR-4.9, FR-5.4 · FRD F3.4 |

## What is this?
This is the panel where users **see and understand** the safety result: the score, the risk level, each factor, where the data came from, and a clear note that the score does not guarantee safety.

## User Story
**As a** user,
**I want** a clear breakdown of why a route got its score,
**so that** I can understand and trust the recommendation.

## Workflow
1. The user selects a route card.
2. The panel shows a **score gauge** (for example 88) with a text label (**Low risk**).
3. Below it, 6 bars show each factor's score with a one-line reason.
4. A **Data** section shows coverage %, sources, last updated, and a "Sample data" badge where it applies.
5. A chart compares all the routes' scores.
6. A disclaimer is always shown: *"Scores reflect available data only and do not guarantee safety."*

## Tasks
- [ ] `components/safety/ScoreGauge.tsx`
- [ ] `components/safety/FactorBreakdown.tsx` (bars + reasons)
- [ ] `components/safety/DataCoverage.tsx` (sources, freshness, sample badge)
- [ ] `components/safety/RouteComparisonChart.tsx` (Recharts bar chart)
- [ ] "How is this calculated?" popover (formula + AI model card)
- [ ] Skeleton loading for the panel
- [ ] Risk colours with text labels (not colour alone)

## Acceptance Criteria
- [ ] **Given** a selected route, **then** I see its score, risk label, and 6 factor bars.
- [ ] **Given** sample data was used, **then** I see a "Sample data" badge.
- [ ] **Given** any score, **then** the disclaimer is visible.
- [ ] **Given** colour-blind viewing, **then** risk is still clear from the text.

## Technical Notes
- Chart colours come from CSS variables; bars have rounded tops
