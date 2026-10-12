# ISSUE-10: Alternative Routes and Route Cards

| Field | Value |
|---|---|
| **Phase / Day** | Phase 4 · Day 4 |
| **Priority** | Must have |
| **Labels** | `routing`, `frontend`, `backend` |
| **Status** | ⬜ Not started |
| **Depends on** | ISSUE-09 |
| **Requirements** | FR-3.1 – FR-3.4 · FRD F2.2, F2.3 |

## What is this?
To compare routes on safety, there must be more than one route. The app asks for up to 3 different routes and shows each one as a card next to the map.

## User Story
**As a** user,
**I want** to see 2–3 different routes side by side,
**so that** I can compare them and choose the one I like.

## Workflow
1. The user searches two places.
2. Up to 3 routes are drawn on the map, each in its own colour.
3. A card is shown for each route: **Route A / B / C**, distance, time, and (later) Safety Score.
4. The user clicks a card, and that route is highlighted on the map.
5. The user clicks a route line on the map, and the matching card is selected.

## Tasks
- [ ] Request `alternative_routes: { target_count: 3 }`
- [ ] Give each route a colour and line style; the selected route is thicker
- [ ] `components/routes/RouteCard.tsx` and `RouteList.tsx`
- [ ] Shared `selectedRouteId` state between the map and the cards
- [ ] Sidebar on desktop, bottom sheet on mobile
- [ ] Cache identical searches for 10 minutes

## Acceptance Criteria
- [ ] **Given** a city search, **then** I see 2–3 routes with different colours.
- [ ] **Given** I click a card, **then** that route is highlighted on the map.
- [ ] **Given** I click a route line, **then** the matching card is selected.
- [ ] **Given** only 1 route is returned, **then** I see a note: "Provider returned one route."

## Technical Notes
- Risk is never shown by colour alone; cards also show text labels
