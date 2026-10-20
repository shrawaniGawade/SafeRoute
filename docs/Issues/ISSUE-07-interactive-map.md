# ISSUE-07: Interactive Map

| Field | Value |
|---|---|
| **Phase / Day** | Phase 3 · Day 3 |
| **Priority** | Must have |
| **Labels** | `map`, `frontend` |
| **Status** | 🟡 In progress (`RoutePlannerPage.tsx` exists) |
| **Depends on** | ISSUE-01 |
| **Requirements** | FR-2.3, FR-2.4 |

## What is this?
The map is the main screen of SafeRoute. Routes, markers, and emergency places are all shown on it. It uses free OpenStreetMap tiles with Leaflet.

## User Story
**As a** user,
**I want** to see an interactive map,
**so that** I can see where I am going and compare routes visually.

## Workflow
1. The user opens the **Route Planner** page.
2. A full-size map loads, centred on the demo city.
3. The user can zoom and drag the map.
4. When the user picks places, markers appear (green for start, red for end).
5. The map credits OpenStreetMap at the bottom.

## Tasks
- [ ] Install `leaflet` and `react-leaflet`
- [ ] Create `components/map/MapView.tsx`
- [ ] Add the OSM tile layer with attribution
- [ ] Set the default centre and zoom (demo city)
- [ ] Add origin and destination marker components
- [ ] Make the map fill the screen next to the sidebar (desktop) or above the bottom sheet (mobile)
- [ ] Show a skeleton while the map loads

## Acceptance Criteria
- [ ] **Given** I open the Route Planner, **then** the map loads with OSM tiles.
- [ ] **Given** the map, **when** I zoom or drag, **then** it moves smoothly.
- [ ] **Given** a 360 px phone screen, **then** the map fits with no horizontal scroll.
- [ ] **Given** the map, **then** "© OpenStreetMap contributors" is visible.

## Technical Notes
- **Files:** `pages/RoutePlannerPage.tsx`, `components/map/MapView.tsx`
- Import `leaflet/dist/leaflet.css`; fix the default marker icon paths in Vite
