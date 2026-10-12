# ISSUE-14: Route Recommendation and Explanation

| Field | Value |
|---|---|
| **Phase / Day** | Phase 5 · Day 5 |
| **Priority** | Must have |
| **Labels** | `safety`, `backend`, `core` |
| **Status** | ⬜ Not started |
| **Depends on** | ISSUE-13 |
| **Requirements** | FR-5.1 – FR-5.5, FR-4.8 · FRD F3.3, F3.4 |

## What is this?
The safest route is not always practical. A route that is 30 minutes longer is not useful. The app picks the **safest route that is still close to the fastest one**, and explains why in simple words.

## User Story
**As a** user,
**I want** the app to recommend one route and tell me why,
**so that** I can decide quickly and trust the choice.

## Workflow
1. Find the fastest route's time.
2. Remove routes that are too much slower (more than +25% or +10 minutes, or the user's own setting).
3. Remove routes with "Insufficient data".
4. Pick the route with the highest Safety Score.
5. If two scores are within 2 points, pick the faster route.
6. Show a reason, for example: *"Route B is recommended: +2 min, +29 safety points."*
7. If no route qualifies, say so and show all the routes.

## Tasks
- [ ] `recommendRoute(routes, maxDetour)` function
- [ ] Generate a reason line for each factor (e.g. "Lighting 90/100: well-lit roads")
- [ ] Generate a summary line for the recommendation
- [ ] Return `recommendedIndex` and `explanation` in the API response
- [ ] Unit tests: detour filter, tie-break, no eligible route

## Acceptance Criteria
- [ ] **Given** the safest route is too slow, **then** it is **not** recommended.
- [ ] **Given** two routes with scores 85 and 84, **then** the faster one is recommended.
- [ ] **Given** a recommendation, **then** I see a one-line reason.
- [ ] **Given** no eligible route, **then** I see "No route meets your detour limit."

## Technical Notes
- This is where the user's `maxDetour` preference (ISSUE-21) is applied
