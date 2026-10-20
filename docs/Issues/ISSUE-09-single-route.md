# ISSUE-09: Show a Route on the Map

| Field | Value |
|---|---|
| **Phase / Day** | Phase 3 · Day 3 |
| **Priority** | Must have |
| **Labels** | `routing`, `frontend`, `backend` |
| **Status** | ⬜ Not started |
| **Depends on** | ISSUE-08 |
| **Requirements** | FR-3.2, FR-3.3 |

## What is this?
After the user picks two places, the app asks a routing service (openrouteservice) for the road path between them and draws it on the map, with the distance and travel time.

## User Story
**As a** user,
**I want** to see the route between my two places,
**so that** I know which way to go, how far it is, and how long it takes.

## Workflow
1. The user clicks **Find Safe Routes**.
2. The frontend sends the start and end points to the backend.
3. The backend asks openrouteservice for the route. The API key stays on the server.
4. The route line is drawn on the map, and the map zooms to fit it.
5. The distance (km) and time (minutes) are shown.

## Tasks
- [ ] Backend `services/routing.service.ts` (openrouteservice, key from `.env`)
- [ ] `POST /api/routes/search` with `{origin, destination, departureTime}`
- [ ] Zod validation for coordinates
- [ ] Convert the response into a shared `Route` type (`id, geometry, distanceKm, durationMin`)
- [ ] Frontend: draw a `Polyline` and fit the map bounds
- [ ] Show the distance and ETA

## Acceptance Criteria
- [ ] **Given** two valid places, **when** I search, **then** a route line appears on the map.
- [ ] **Given** the route, **then** I see the distance in km and the time in minutes.
- [ ] **Given** the browser network tab, **then** no routing API key is visible.

## Technical Notes
- Geometry from openrouteservice is in `[lng, lat]` order; Leaflet needs `[lat, lng]`
- Environment variable: `ORS_API_KEY`
