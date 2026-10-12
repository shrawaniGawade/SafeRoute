# ISSUE-26: Security Hardening

| Field | Value |
|---|---|
| **Phase / Day** | Phase 9 · Day 9 |
| **Priority** | Must have |
| **Labels** | `security`, `backend` |
| **Status** | 🟡 Partly done (auth security done) |
| **Depends on** | All backend issues |
| **Requirements** | NFR-3 – NFR-6 · BRD §11 |

## What is this?
A final check that user data and the system are protected: passwords, tokens, API keys, inputs, and permissions.

## User Story
**As a** user,
**I want** my account and data to be protected,
**so that** nobody else can access or misuse them.

## Workflow (Checklist Review)
1. Check that passwords are hashed and never logged.
2. Check that all inputs are validated.
3. Check that every private API checks the login, role, and ownership.
4. Check that API keys live only on the server.
5. Check rate limits on login and route search.
6. Check that CORS allows only our frontend.
7. Check that HTTPS and secure cookies are on in production.

## Tasks
- [x] bcrypt hashing, token rotation, rate limits on auth
- [x] Helmet security headers
- [ ] Rate limit `/api/routes/search` and `/api/geocode`
- [ ] Zod validation on every new endpoint and every `:id` parameter
- [ ] Ownership checks on history and preferences
- [ ] Search the code and Git history for leaked secrets
- [ ] Make sure no tokens or passwords appear in logs
- [ ] Set the production CORS origin
- [ ] Run `npm audit` and fix high-severity issues

## Acceptance Criteria
- [ ] **Given** 100 fast searches, **then** later ones get 429.
- [ ] **Given** an invalid ID like `abc`, **then** the API returns 400, not 500.
- [ ] **Given** the frontend bundle, **then** it contains no secret keys.
- [ ] **Given** `npm audit`, **then** there are no high or critical issues.

## Technical Notes
- **Files:** `middleware/rateLimiter.ts`, `middleware/validate.ts`
