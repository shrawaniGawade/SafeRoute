# ISSUE-08: Location Search (Geocoding)

| Field | Value |
|---|---|
| **Phase / Day** | Phase 3 · Day 3 |
| **Priority** | Must have |
| **Labels** | `map`, `frontend`, `backend` |
| **Status** | ⬜ Not started |
| **Depends on** | ISSUE-07 |
| **Requirements** | FR-2.1, FR-2.2 · FRD F2.1 |

## What is this?
Users type a place name such as "Central Station", and the app finds its location on the map. Turning a name into coordinates is called **geocoding**.

## User Story
**As a** user,
**I want** to type my start and end places and pick them from suggestions,
**so that** I don't need to know exact addresses or coordinates.

## Workflow
1. The user types in the **From** box.
2. After 3 letters, the app waits briefly (400 ms) and then shows up to 5 suggestions.
3. The user picks one, and a marker appears on the map.
4. The user does the same in the **To** box.
5. The **Find Safe Routes** button becomes active.

## Tasks
- [ ] Backend `services/geocoding.service.ts` (Nominatim)
- [ ] `GET /api/geocode?q=` with Zod validation and caching
- [ ] Respect the Nominatim limit (1 request per second) and send a proper User-Agent
- [ ] Frontend `LocationInput` component with debounce and a dropdown
- [ ] Keyboard support (up/down arrows, Enter, Esc)
- [ ] "Use my location" button (optional)
- [ ] Validation: both filled, and From ≠ To

## Acceptance Criteria
- [ ] **Given** I type "Cent", **then** I see matching suggestions.
- [ ] **Given** I pick a suggestion, **then** a marker appears at that place.
- [ ] **Given** no results, **then** I see "No places found".
- [ ] **Given** the same place in both boxes, **then** I see "Choose two different locations".

## Technical Notes
- Geocoding runs on the backend, which keeps API rules and caching in one place
