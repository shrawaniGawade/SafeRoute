# ISSUE-20: Route History

| Field | Value |
|---|---|
| **Phase / Day** | Phase 8 · Day 8 |
| **Priority** | Must have |
| **Labels** | `user`, `frontend`, `backend` |
| **Status** | ⬜ Not started |
| **Depends on** | ISSUE-06, ISSUE-14 |
| **Requirements** | FR-8.1 – FR-8.3 · FRD F6.1, F6.2, F6.4 |

## What is this?
Logged-in users' searches are saved automatically, so they can open them again later. Users can only see and delete **their own** history.

## User Story
**As a** registered user,
**I want** my past route searches saved,
**so that** I can quickly check a route again without searching from scratch.

## Workflow
1. A logged-in user searches a route, and it is saved automatically.
2. The user opens **Dashboard → History**.
3. They see a list: From → To, date, and the recommended score (newest first).
4. **View** opens that search on the map again.
5. **Delete** asks "Are you sure?" and then removes it.
6. A guest who clicks **Save** sees "Log in to save routes".

## Tasks
- [ ] `models/RouteSearch.ts` (`userId, origin, destination, routes, recommendedIndex, createdAt`)
- [ ] Save automatically after a search when logged in
- [ ] `GET /api/routes/history?page=` (10 per page, own items only)
- [ ] `DELETE /api/routes/history/:id` (checks the owner; 404 if not the owner)
- [ ] `pages/DashboardPage.tsx` → history list, empty state, skeleton
- [ ] Delete confirmation dialog
- [ ] Tests: ownership and pagination

## Acceptance Criteria
- [ ] **Given** I search while logged in, **when** I refresh and open History, **then** my search is there.
- [ ] **Given** I delete an item, **then** it disappears from the list.
- [ ] **Given** another user's item ID, **when** I try to delete it, **then** I get 404.
- [ ] **Given** no history, **then** I see "No saved routes yet."

## Technical Notes
- A 404 (not 403) for other users' items avoids revealing that they exist
