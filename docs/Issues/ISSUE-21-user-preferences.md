# ISSUE-21: User Preferences

| Field | Value |
|---|---|
| **Phase / Day** | Phase 8 · Day 8 |
| **Priority** | Should have |
| **Labels** | `user`, `frontend`, `backend` |
| **Status** | ⬜ Not started |
| **Depends on** | ISSUE-14, ISSUE-20 |
| **Requirements** | FR-8.4, FR-8.5 · FRD F6.3 |

## What is this?
Each person is willing to travel a different amount of extra time for a safer route. Preferences let users set this limit, and it changes which route the app recommends.

## User Story
**As a** registered user,
**I want** to set how much extra time I accept for a safer route,
**so that** recommendations match my needs.

## Workflow
1. The user opens **Dashboard → Preferences**.
2. They set:
   - **Max extra time:** for example up to +15% or +8 minutes
   - **Default travel time:** Now, Day, or Night
3. They click **Save** and see "Preferences saved".
4. The next route search uses these settings.

## Tasks
- [ ] Add `preferences { maxDetourPct, maxDetourMin, defaultTime }` to the User model
- [ ] `GET /api/user/preferences` and `PUT /api/user/preferences` (Zod: 0–50% / 0–30 min)
- [ ] Preferences form with sliders and a save toast
- [ ] Pass the preferences to `recommendRoute()` during search
- [ ] Favourite destinations (optional, Could-have)

## Acceptance Criteria
- [ ] **Given** I set the max extra time to +5%, **when** I search, **then** slower safe routes are not recommended.
- [ ] **Given** an invalid value (60%), **then** I see "Detour must be within limits".
- [ ] **Given** I save and reload, **then** my preferences are still there.

## Technical Notes
- Guests use the defaults (smaller of +25% or +10 minutes)
