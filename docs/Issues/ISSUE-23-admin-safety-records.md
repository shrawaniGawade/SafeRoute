# ISSUE-23: Admin Safety-Record Management

| Field | Value |
|---|---|
| **Phase / Day** | Phase 8 · Day 8 |
| **Priority** | Should have |
| **Labels** | `admin`, `data`, `frontend`, `backend` |
| **Status** | ⬜ Not started |
| **Depends on** | ISSUE-12, ISSUE-22 |
| **Requirements** | FR-9.4 · FRD F7.4 |

## What is this?
Admins can add, edit, or delete safety records, for example marking a street as poorly lit. Each change is checked for mistakes, and it updates the "last updated" date that users see.

## User Story
**As an** administrator,
**I want** to manage safety records,
**so that** the safety scores stay accurate and up to date.

## Workflow
1. The admin opens **Admin → Safety Records**.
2. They see a table: factor, value, location, source, sample?, last updated.
3. They click **Add record**, fill in the form, and save.
4. If something is wrong (for example value = 150), they see a clear error.
5. They can **Edit** or **Delete** a record (with confirmation).
6. Every change is written to the audit log.

## Tasks
- [ ] `GET / POST / PUT / DELETE /api/admin/safety-records`
- [ ] Zod: factor ∈ {lighting, crime, accident, activity}, value 0–100, lng −180–180, lat −90–90, source required
- [ ] Table with search, filter, and pagination
- [ ] Add/edit form (optionally pick the location on a mini map)
- [ ] Write an audit log entry for each change
- [ ] Tests: validation and admin-only access

## Acceptance Criteria
- [ ] **Given** valid data, **when** I add a record, **then** it appears in the table.
- [ ] **Given** a value of 150, **then** I see "Value must be 0–100".
- [ ] **Given** a normal user, **when** they call this API, **then** they get 403.
- [ ] **Given** I edit a record, **then** its "last updated" date changes.

## Technical Notes
- All routes sit behind `requireAuth` + `requireRole('admin')`
