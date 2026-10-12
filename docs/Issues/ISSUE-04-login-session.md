# ISSUE-04: Login, Session Refresh and Logout

| Field | Value |
|---|---|
| **Phase / Day** | Phase 2 · Day 2 |
| **Priority** | Must have |
| **Labels** | `auth`, `security`, `frontend`, `backend` |
| **Status** | ✅ Done |
| **Depends on** | ISSUE-03 |
| **Requirements** | FR-1.4, FR-1.5, FR-1.8, FR-1.9 · FRD F1.3, F1.4 |

## What is this?
Registered users log in with their email and password. The app then keeps them logged in safely by using two tokens:
- an **access token**, which lasts 15 minutes and is kept only in memory
- a **refresh token**, which lasts 7 days and is stored in a secure cookie

Each time the refresh token is used it is replaced with a new one. If someone steals an old token, it no longer works.

## User Story
**As a** registered user,
**I want** to log in once and stay logged in safely,
**so that** I don't have to type my password again and again.

## Workflow
1. The user clicks **Log in** and enters their email and password.
2. If the details are correct, the user is logged in and their name appears in the navbar.
3. When the access token expires, the app quietly gets a new one in the background.
4. If the user refreshes the page, they stay logged in.
5. The user clicks **Log out**, and the session ends everywhere it was used.

## Tasks
- [x] `POST /api/auth/login`: bcrypt compare, then issue both tokens
- [x] `POST /api/auth/refresh-token`: rotate the token; reuse of an old token revokes all sessions
- [x] `POST /api/auth/logout`: revoke the token and clear the cookie
- [x] `GET /api/auth/me`: return the current user
- [x] RefreshToken model (hashed, with a TTL index)
- [x] Frontend `AuthContext` with silent refresh on 401
- [x] `LoginForm` and the navbar user menu (with an admin badge)

## Acceptance Criteria
- [x] **Given** correct details, **when** I log in, **then** I see my name in the navbar.
- [x] **Given** a wrong password, **then** I see "Invalid email or password".
- [x] **Given** I am logged in, **when** I refresh the page, **then** I stay logged in.
- [x] **Given** a refresh token that was already used, **when** it is reused, **then** all my sessions are logged out.
- [x] **Given** I click Logout, **then** I return to the landing page as a guest.

## Technical Notes
- **Cookie:** `httpOnly`, `Secure`, `SameSite=Lax`
- **Files:** `services/tokenService.ts`, `middleware/authMiddleware.ts`, `context/AuthContext.tsx`
