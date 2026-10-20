# ISSUE-22: Admin Dashboard and User Management

| Field | Value |
|---|---|
| **Phase / Day** | Phase 8 · Day 8 |
| **Priority** | Must have |
| **Labels** | `admin`, `frontend`, `backend` |
| **Status** | ✅ Done (search counts to be added after ISSUE-20) |
| **Depends on** | ISSUE-06 |
| **Requirements** | FR-9.1 – FR-9.3 · FRD F7.2, F7.3 |

## What is this?
Admins get a dashboard showing how the system is doing: number of users, server health, AI service status, and AI response time. They can also change user roles or remove users.

## User Story
**As an** administrator,
**I want** to see system statistics and manage users,
**so that** I can keep the application healthy and secure.

## Workflow
1. The admin logs in, and an **Admin** badge appears in the navbar.
2. The admin opens the **Admin Dashboard**.
3. They see cards: total users, verified users, admins, AI status (up or down), AI latency, server uptime and memory.
4. The figures refresh automatically.
5. In the users table, the admin can **switch the role** (user ↔ admin) or **delete** a user (with confirmation).
6. The admin cannot demote or delete their own account.

## Tasks
- [x] `GET /api/admin/stats` (users, ML status, latency, memory)
- [x] `PATCH /api/admin/users/:id/role`
- [x] `DELETE /api/admin/users/:id`
- [x] Admin badge in the navbar
- [x] Live polling of the figures
- [ ] Add the route-search count after ISSUE-20
- [ ] Block admins from changing or deleting themselves (verify)

## Acceptance Criteria
- [x] **Given** I am an admin, **then** I see the statistics on the dashboard.
- [x] **Given** I switch a user to admin, **then** their role changes.
- [ ] **Given** I try to delete myself, **then** the action is blocked.
- [x] **Given** a normal user opens the admin page, **then** they are redirected.

## Technical Notes
- **Files:** `controllers/adminController.ts`, `routes/adminRoutes.ts`
