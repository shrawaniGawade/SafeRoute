# ISSUE-19: Emergency Locations and Emergency Mode

| Field | Value |
|---|---|
| **Phase / Day** | Phase 8 · Day 8 |
| **Priority** | Should have |
| **Labels** | `safety`, `map`, `frontend`, `backend` |
| **Status** | ⬜ Not started |
| **Depends on** | ISSUE-07, ISSUE-12 |
| **Requirements** | FR-7.1 – FR-7.4 · FRD F5.1, F5.2 |

## What is this?
Users can see hospitals, police stations, and fire stations near their route. An **Emergency** button opens a screen with emergency phone numbers and the nearest help. The app does **not** call or alert anyone automatically.

## User Story
**As a** user travelling at night,
**I want** to see nearby help and call emergency numbers quickly,
**so that** I feel prepared if something goes wrong.

## Workflow
1. After a search, emergency places appear on the map with their own icons.
2. The user can show or hide each type (hospital, police, fire).
3. Clicking an icon shows its name, type, and data source.
4. The user taps the red **Emergency** button (always visible).
5. A screen shows **112 · Police 100 · Ambulance 108 · Women helpline 1091**, with tap-to-call.
6. It also lists the 3 nearest facilities and their distance.

## Tasks
- [ ] `GET /api/emergency-locations?lat=&lng=&radius=`
- [ ] Marker icons for each type (lucide icons) and filter toggles
- [ ] `EmergencyButton` (fixed position) and `EmergencyModal`
- [ ] `tel:` links for the numbers
- [ ] Nearest 3 facilities, sorted by distance
- [ ] Source label ("OpenStreetMap")

## Acceptance Criteria
- [ ] **Given** a route search, **then** nearby hospitals, police, and fire stations appear on the map.
- [ ] **Given** I tap Emergency, **then** I see the emergency numbers and the nearest places.
- [ ] **Given** a phone, **when** I tap a number, **then** the phone dialler opens.
- [ ] **Given** Emergency Mode, **then** there is no text claiming that help has been sent.

## Technical Notes
- Only verified public numbers are shown; private contacts are never displayed
