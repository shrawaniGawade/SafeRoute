# ISSUE-25: Testing and QA

| Field | Value |
|---|---|
| **Phase / Day** | Phase 9 · Day 9 |
| **Priority** | Must have |
| **Labels** | `testing`, `qa` |
| **Status** | 🟡 Partly done (auth, admin, and e2e tests exist) |
| **Depends on** | All feature issues |
| **Requirements** | NFR-13 · FRD §13 (TC-01 – TC-16) |

## What is this?
Testing makes sure everything works before the demo. A bug during the presentation does more damage than a missing feature.

## User Story
**As a** developer,
**I want** automated and manual tests for the main flows,
**so that** I can be confident the app works during the demo.

## Workflow
1. **Unit tests** check small parts (for example the score formula).
2. **API tests** check endpoints (for example that admins only can access admin routes).
3. **E2E tests** act like a real user in a browser (search → recommendation → save).
4. **Failure tests** check what happens when services break.
5. **Manual run:** go through test cases TC-01 – TC-16 and mark pass or fail.

## Tasks
- [ ] Vitest: scoring engine (≥ 80% coverage), recommendation, validators
- [x] Supertest: auth flows, admin 401/403
- [ ] Supertest: history ownership, validation 400, route search
- [ ] pytest: AI `/predict-route`, invalid input, low coverage
- [ ] Playwright: guest search; user saves a route; admin login
- [ ] Failure tests: routing 429/500, AI down, empty results
- [ ] Record the TC-01 – TC-16 results in `docs/TEST_RESULTS.md`
- [ ] CI runs all tests on every pull request

## Acceptance Criteria
- [ ] **Given** a pull request, **then** CI runs all tests and they pass.
- [ ] **Given** the test results file, **then** all Must-have cases pass.
- [ ] **Given** a fresh browser, **then** the full demo flow works without console errors.

## Technical Notes
- **Existing files:** `backend/src/tests/auth.test.ts`, `admin.test.ts`, `e2e.test.ts`
