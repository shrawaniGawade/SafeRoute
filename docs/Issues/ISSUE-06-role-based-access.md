# ISSUE-06: Role-Based Access Control

| Field | Value |
|---|---|
| **Phase / Day** | Phase 2 · Day 2 |
| **Priority** | Must have |
| **Labels** | `auth`, `security`, `backend` |
| **Status** | ✅ Done |
| **Depends on** | ISSUE-04 |
| **Requirements** | FR-9.1, NFR-6 · FRD F7.1 |

## What is this?
SafeRoute has three kinds of users: **Guest**, **User**, and **Admin**. Each one can do different things. The checks happen on the **server**, so hiding a button in the frontend is not enough to bypass them.

## User Story
**As an** administrator,
**I want** admin pages and APIs to be protected,
**so that** normal users cannot change system data.

## Workflow
1. Every request to `/api/admin/*` is checked first.
2. With no login, the server replies **401 Not logged in**.
3. If the user is logged in but not an admin, the server replies **403 Forbidden**.
4. If the user is an admin, the request continues.
5. In the frontend, non-admins who try to open the admin page are sent back to the home page.

## Tasks
- [x] `requireAuth` middleware (checks the access token)
- [x] `requireRole('admin')` middleware
- [x] Apply both to all `/api/admin` routes
- [x] `seedAdmin.ts`: create the first admin from environment variables
- [x] Frontend protected route for the admin page
- [x] Tests: guest → 401, user → 403, admin → 200

## Acceptance Criteria
- [x] **Given** no login, **when** I call `/api/admin/stats`, **then** I get 401.
- [x] **Given** a normal user, **when** I call `/api/admin/stats`, **then** I get 403.
- [x] **Given** an admin, **when** I call `/api/admin/stats`, **then** I get 200.

## Technical Notes
- **Files:** `middleware/authMiddleware.ts`, `routes/adminRoutes.ts`, `config/seedAdmin.ts`, `tests/admin.test.ts`

| Feature | Guest | User | Admin |
|---|:---:|:---:|:---:|
| Search routes | ✅ | ✅ | ✅ |
| Save history | ❌ | ✅ | ✅ |
| Admin dashboard | ❌ | ❌ | ✅ |
