# ISSUE-11: Loading, Error and Empty States for Route Search

| Field | Value |
|---|---|
| **Phase / Day** | Phase 4 · Day 4 |
| **Priority** | Must have |
| **Labels** | `ux`, `frontend`, `resilience` |
| **Status** | ✅ Complete |
| **Depends on** | ISSUE-10 |
| **Requirements** | FR-3.5, NFR-7 · FRD F2.2 |

## What is this?
External services can be slow or fail. Instead of a blank screen or a crash, the app should always show the user what is happening and what they can do next.

## User Story
**As a** user,
**I want** clear messages when something is loading or goes wrong,
**so that** I am never confused or stuck.

## Workflow

| Situation | What the user sees |
|---|---|
| Searching | Skeleton cards and a loading line on the map |
| No route found | "No route available between these points." |
| Too many requests (429) | "Route service is busy. Please retry in a minute." |
| Network or server error | "Couldn't load routes." and a **Retry** button |
| Before any search | A friendly hint: "Enter a start and destination to compare routes." |

## Tasks
- [x] `RouteCardSkeleton` component (pulse animation)
- [x] Empty-state component with an icon and a hint
- [x] Error-state component with a Retry button
- [x] Backend maps provider errors to clear status codes (404, 429, 503)
- [x] Frontend `.catch()` on every request; raw errors are never shown
- [x] Respect `prefers-reduced-motion` for animations

## Acceptance Criteria
- [x] **Given** a slow network, **then** I see skeleton cards, not a blank screen.
- [x] **Given** the routing API returns 429, **then** I see the "busy" message.
- [x] **Given** a network error, **when** I click Retry, **then** the search runs again.

## Technical Notes
- Test these by mocking the routing service in the backend tests
