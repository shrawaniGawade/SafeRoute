# ISSUE-28: Deployment

| Field | Value |
|---|---|
| **Phase / Day** | Phase 8 (staging) · Phase 10 (production) |
| **Priority** | Must have |
| **Labels** | `devops`, `deployment` |
| **Status** | 🟡 Partly done (`vercel.json`, Dockerfiles exist) |
| **Depends on** | ISSUE-25, ISSUE-26 |
| **Requirements** | BRD §20, NFR-14 |

## What is this?
This puts SafeRoute online, so anyone can open it with a link. A **staging** (test) version goes up by Day 8, and the final **production** version on Day 10.

## User Story
**As an** evaluator,
**I want** to open SafeRoute from a live link,
**so that** I can try it without installing anything.

## Workflow
1. Push the code to GitHub.
2. The frontend and API deploy to **Vercel**.
3. The AI service deploys to **Render, Railway, or Docker**.
4. The database runs on **MongoDB Atlas**.
5. Set all environment variables in each host.
6. Open the live link on a phone and a laptop and test everything.

## Tasks
- [ ] Day 8: deploy `dev` to a staging URL
- [ ] Set environment variables: `MONGO_URI`, `JWT_*`, `ORS_API_KEY`, `SMTP_*`, `AI_SERVICE_URL`, `CORS_ORIGIN`
- [ ] Deploy the AI service and connect it with `AI_SERVICE_URL`
- [ ] Allow the deployed IPs in MongoDB Atlas network access
- [ ] Check: map tiles, search, routing, cookies (Secure), CORS
- [ ] Seed demo data (admin, demo user, safety records)
- [ ] Day 10: merge `dev` → `main`, tag `v1.0.0`, deploy to production
- [ ] Smoke test on a second device

## Acceptance Criteria
- [ ] **Given** the live link, **then** the full journey works (register → search → save → admin).
- [ ] **Given** the AI service is off, **then** the live app still works with the fallback.
- [ ] **Given** a phone, **then** the live app works and looks correct.

## Technical Notes
- Keep a recorded demo video as a backup in case the network fails
