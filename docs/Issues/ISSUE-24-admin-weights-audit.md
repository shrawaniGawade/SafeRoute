# ISSUE-24: Admin Scoring Weights and Audit Log

| Field | Value |
|---|---|
| **Phase / Day** | Phase 8 · Day 8 |
| **Priority** | Should have |
| **Labels** | `admin`, `safety`, `backend`, `frontend` |
| **Status** | ⬜ Not started |
| **Depends on** | ISSUE-13, ISSUE-22 |
| **Requirements** | FR-9.5, FR-9.6 · FRD F7.5, F7.6 |

## What is this?
Admins can change how important each safety factor is (its weight), within safe limits. Every important admin action is recorded in an **audit log**, so it is always clear who changed what, and when.

## User Story
**As an** administrator,
**I want** to adjust factor weights and see a log of changes,
**so that** I can tune the scoring and keep a record of every change.

## Workflow
1. The admin opens **Admin → Scoring Weights**.
2. They see 6 sliders, one per factor (each 0–50%), and a live **Total**.
3. **Save** works only when the total is exactly **100%**.
4. **Reset to defaults** sets 25/25/20/10/10/10.
5. After saving, new searches use the new weights.
6. In **Admin → Audit Log**, the admin sees each change: time, admin, action, before and after values.

## Tasks
- [ ] `models/ScoringConfig.ts` (single document) + `models/AuditLog.ts`
- [ ] `GET / PUT /api/admin/weights` (Zod: each 0–0.5, total = 1)
- [ ] The scoring engine reads the weights from the database (cached)
- [ ] Weights page with sliders, a live total, save, and reset
- [ ] Audit helper `logAction(actorId, action, target, before, after)`
- [ ] `GET /api/admin/audit-logs` (newest first) and the audit table page

## Acceptance Criteria
- [ ] **Given** the total is 95%, **then** Save is disabled and shows "Weights must total 100%".
- [ ] **Given** I save new weights, **when** I search, **then** the scores use the new weights.
- [ ] **Given** I change weights, **then** a new audit-log row shows the before and after values.
- [ ] **Given** a normal user, **then** these APIs return 403.

## Technical Notes
- Limits stop one factor from dominating the score
