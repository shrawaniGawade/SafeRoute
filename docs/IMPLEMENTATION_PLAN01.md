# Implementation Plan

**Project:** SafeRoute – AI-Powered Safety-Aware Route Recommendation System
**Document ID:** IMP01
**Version:** 1.0
**Date:** 11 October 2026
**Prepared by:** Pratik Dawane
**Related documents:** [BRD01](BRD01.md) · [SRS01](SRS01.md) · [FRD01](FRD01.md)

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Approach](#2-approach)
3. [Current Status](#3-current-status)
4. [Phase Overview](#4-phase-overview)
5. [Phase 1 – Foundation (Day 1)](#phase-1--foundation-day-1)
6. [Phase 2 – Authentication and Roles (Day 2)](#phase-2--authentication-and-roles-day-2)
7. [Phase 3 – Maps and Location Search (Day 3)](#phase-3--maps-and-location-search-day-3)
8. [Phase 4 – Multiple Routes and Comparison (Day 4)](#phase-4--multiple-routes-and-comparison-day-4)
9. [Phase 5 – Safety Engine and ML Dataset (Day 5)](#phase-5--safety-engine-and-ml-dataset-day-5)
10. [Phase 6 – ML Model Training and Evaluation (Day 6)](#phase-6--ml-model-training-and-evaluation-day-6)
11. [Phase 7 – ML Integration (Day 7)](#phase-7--ml-integration-day-7)
12. [Phase 8 – Safety UI, User and Admin Features (Day 8)](#phase-8--safety-ui-user-and-admin-features-day-8)
13. [Phase 9 – Testing, Security and Quality (Day 9)](#phase-9--testing-security-and-quality-day-9)
14. [Phase 10 – Deployment and Documentation (Day 10)](#phase-10--deployment-and-documentation-day-10)
15. [Optional Phase 11–12 – Improvement and Presentation](#optional-phase-1112--improvement-and-presentation)
16. [Git Workflow](#16-git-workflow)
17. [Daily Routine](#17-daily-routine)
18. [Risk Checkpoints](#18-risk-checkpoints)
19. [Definition of Done](#19-definition-of-done)

---

## 1. Purpose

This plan breaks the BRD, SRS, and FRD down into **phases and steps** that can be carried out in order. Each phase has:

- **Goal**: what the phase delivers
- **Why**: a short reason it comes at this point
- **Steps**: what to do, with brief details
- **Requirements covered**: links to the SRS/FRD IDs
- **Exit criteria**: what must work before moving on

---

## 2. Approach

**Build order:** foundation → core navigation → safety engine → AI/ML → user and admin features → testing → deployment.

**Why this order:** each phase depends on the one before it. Routes must exist before they can be scored, and scores must exist before they can be explained or saved. Building the main workflow first means there is always a working demo, even if optional features are cut later.

**Guiding rules:**
1. **MVP first.** Must-have requirements come before Should-have and Could-have ones.
2. **Vertical slices.** Each feature is built end to end (API → UI → test) before starting the next.
3. **Fallbacks everywhere.** Every external call (routing, ML, email) has a clear error state.
4. **Deploy early.** A staging URL is live by Day 8, not Day 10.
5. **Label honestly.** Sample data and demo models are marked as such in the UI.

---

## 3. Current Status

| Area | Status | Where |
|---|---|---|
| Monorepo, Vite and Express setup, CI, Docker, Vercel config | ✅ Done | `frontend/`, `backend/`, `.github/workflows/ci.yml`, `vercel.json` |
| Auth: register, OTP, login, refresh rotation, reset, logout | ✅ Done | `backend/src/routes/authRoutes.ts`, `frontend/src/components/auth/` |
| Admin: stats, role toggle, delete user, admin badge | ✅ Done | `backend/src/routes/adminRoutes.ts` |
| ML service (FastAPI + training script) | 🟡 Demo model | `ai/app/main.py`, `ai/model/train_model.py` |
| Landing page, router, route planner page | 🟡 In progress | `frontend/src/pages/`, `frontend/src/router.ts` |
| Route search, safety engine, history, emergency, safety-record CRUD | ⬜ Not started | — |

So Phases 1–2 are mostly complete. The remaining effort goes into Phases 3–10.

---

## 4. Phase Overview

| Phase | Day | Focus | Key deliverable |
|---|:---:|---|---|
| 1 | 1 | Foundation | The app runs locally and the frontend can call the backend |
| 2 | 2 | Authentication | Login works; admin endpoints reject non-admins |
| 3 | 3 | Maps | Search two places and see one route on the map |
| 4 | 4 | Multiple routes | Compare 2–3 alternatives with distance and ETA |
| 5 | 5 | Safety engine + ML data | Every route has an explainable score; ML dataset ready |
| 6 | 6 | ML training | A trained, evaluated, versioned model |
| 7 | 7 | ML integration | AI estimate shown in the app, with a fallback |
| 8 | 8 | Safety UI, user and admin | Breakdown UI, history, emergency, admin CRUD; staging deployed |
| 9 | 9 | Quality | Tests pass; security hardened; responsive layout fixed |
| 10 | 10 | Release | Production deployment, README, rehearsal |
| 11–12 | Optional | Polish | Better data, demo video, interview preparation |

```
Day:  1    2    3    4    5    6    7    8    9    10   11   12
      [Found][Auth][Maps][Routes][Safety+Data][Train][ML API][UI+Admin][Test][Deploy][Opt][Opt]
      └──── Core application ────┘└──── AI/ML ─────────────┘└── Completion ──────┘
```

---

## Phase 1 – Foundation (Day 1)

**Goal:** a clean, running project skeleton that the frontend and backend can both work in.
**Why:** a stable base prevents setup problems later. The dataset is chosen now because finding data is the biggest risk to the ML work.

| # | Step | Brief details |
|---|---|---|
| 1.1 | Finalize scope | Confirm the Must-have list from BRD §5.1 and write user stories as GitHub issues |
| 1.2 | Repository setup | `main` and `dev` branches, README, `.gitignore`, `.env.example` |
| 1.3 | Frontend scaffold | Vite + React + TypeScript, React Router, Axios, Lucide icons |
| 1.4 | Backend scaffold | Express + TypeScript, Helmet, CORS, cookie-parser, `/api/health` |
| 1.5 | Database | MongoDB Atlas cluster, Mongoose connection in `config/db.ts` |
| 1.6 | Tooling | ESLint, Prettier, TypeScript strict mode, CI workflow (lint, type-check, test) |
| 1.7 | Base layout | Navbar, footer, page shell, design tokens (navy, teal, neutrals) |
| 1.8 | **Choose datasets** | Pick a city, plus an incident or accident dataset and its source; note the licence |

**Requirements covered:** NFR-12, NFR-14
**Exit criteria:** ✅ `npm run dev` starts both apps · ✅ the frontend shows the `/api/health` response · ✅ CI passes · ✅ dataset chosen

---

## Phase 2 – Authentication and Roles (Day 2)

**Goal:** secure accounts and server-side role checks.
**Why:** history, preferences, and the admin features all depend on knowing who the user is.

| # | Step | Brief details |
|---|---|---|
| 2.1 | User model | `name, email, passwordHash, role, isVerified, preferences` |
| 2.2 | Register + OTP | bcrypt hashing, 6-digit OTP by email, attempt limit and cooldown |
| 2.3 | Login and tokens | 15-minute access token (in memory) and 7-day refresh token (`httpOnly` cookie) |
| 2.4 | Refresh rotation | New token on every refresh; reusing a revoked token revokes all sessions |
| 2.5 | Forgot / reset password | OTP-based; the same response whatever the email, so emails cannot be enumerated |
| 2.6 | Middleware | `requireAuth`, `requireRole('admin')`, Zod `validateBody`, rate limiters |
| 2.7 | Admin seed | `seedAdmin.ts` creates the first admin from environment variables |
| 2.8 | Frontend auth | AuthContext, login, register, OTP, and reset forms, protected routes |
| 2.9 | Tests | Supertest: register, login, duplicate, wrong password, 403 on admin |

**Requirements covered:** FR-1.1 – FR-1.9, FR-9.1 · FRD F1.1 – F1.5
**Exit criteria:** ✅ register → verify → login → refresh → logout all work · ✅ a normal user gets 403 on `/api/admin/*`

---

## Phase 3 – Maps and Location Search (Day 3)

**Goal:** a user can search two places and see a real route on the map.
**Why:** the map is the main screen, and every later feature appears on it.

| # | Step | Brief details |
|---|---|---|
| 3.1 | Install map libraries | `leaflet`, `react-leaflet`; add OSM tiles with attribution |
| 3.2 | Map component | `components/map/MapView.tsx`: full-height map, zoom and pan controls |
| 3.3 | Geocoding service | Backend `services/geocoding.service.ts` calls Nominatim; cache results |
| 3.4 | Search inputs | Origin and destination autocomplete (3 characters minimum, 400 ms debounce, up to 5 suggestions) |
| 3.5 | Routing service | Backend `services/routing.service.ts` calls openrouteservice; the API key stays on the server |
| 3.6 | Route endpoint | `POST /api/routes/search` with `{origin, destination, departureTime}` and Zod validation |
| 3.7 | Draw the route | Decode the geometry, then draw a `Polyline` and origin and destination markers; fit the map to the route |
| 3.8 | Show distance and ETA | Convert metres to km and seconds to minutes |

**Requirements covered:** FR-2.1 – FR-2.4, FR-3.3 · FRD F2.1
**Exit criteria:** ✅ type two places → one route appears on the map with its distance and ETA

---

## Phase 4 – Multiple Routes and Comparison (Day 4)

**Goal:** compare 2–3 alternative routes side by side.
**Why:** a safety comparison needs more than one option.

| # | Step | Brief details |
|---|---|---|
| 4.1 | Request alternatives | openrouteservice `alternative_routes: {target_count: 3}` |
| 4.2 | Normalize the response | One shared `Route` type: `id, geometry, distanceKm, durationMin` |
| 4.3 | Distinct styles | A different colour and dash style for each route; the selected route is thicker |
| 4.4 | Route cards | `components/routes/RouteCard.tsx`: name, distance, ETA, placeholder for the score |
| 4.5 | Sync map and cards | Shared `selectedRouteId` state; clicking a card or a line selects that route |
| 4.6 | UI states | Skeleton loading; no-route, error with retry, rate-limit (429), single-route note |
| 4.7 | Responsive layout | Sidebar on desktop, swipeable bottom sheet on mobile |
| 4.8 | Cache | Cache identical searches for about 10 minutes to stay within API limits |

**Requirements covered:** FR-3.1 – FR-3.5 · FRD F2.2, F2.3
**Exit criteria:** ✅ 2–3 routes drawn and selectable · ✅ every error state can be triggered and looks correct · ✅ works at 360 px

---

## Phase 5 – Safety Engine and ML Dataset (Day 5)

**Goal:** every route gets an explainable Safety Score, and the ML dataset is ready.
**Why:** the safety score is the main feature that sets SafeRoute apart. It must work without ML so the demo is never blocked.

### 5A – Rule-based Safety Engine

| # | Step | Brief details |
|---|---|---|
| 5.1 | Data models | `SafetyRecord` and `EmergencyLocation` (GeoJSON + `2dsphere` index) |
| 5.2 | Seed data | Import emergency facilities from Overpass and lighting from OSM `lit`; load crime and accident data from the dataset; mark simulated data with `isSample` |
| 5.3 | Route sampling | Take a point about every 200 m along the geometry (`@turf/along`) |
| 5.4 | Factor extraction | `$geoNear` within about 250 m of each point, then average each factor |
| 5.5 | Normalization | Scale each factor to 0–100 (higher is better); time rules: day 100, evening 70, night 40 |
| 5.6 | Weighted score | `services/safetyScore.service.ts`: `Σ w·s`, redistribute missing weight, compute coverage % |
| 5.7 | Risk and threshold | ≥75 Low · 50–74 Moderate · <50 High · coverage <60% → "Insufficient data" |
| 5.8 | Recommendation | Filter by maximum detour → exclude insufficient → highest score → tie-break on ETA |
| 5.9 | Explanations | A one-line reason for each factor, plus a summary line (e.g. "+2 min, +29 points") |
| 5.10 | Unit tests | Formula, missing data, threshold, tie-break, detour filter (Vitest) |

### 5B – ML Dataset Preparation

| # | Step | Brief details |
|---|---|---|
| 5.11 | Define the target | e.g. "High-incident cell" (yes/no) for a grid cell and hour band |
| 5.12 | Clean the data | Remove duplicates and invalid coordinates; handle missing values |
| 5.13 | Feature engineering | Hour, weekday, night flag, lighting, past incident count, accident count, POI density |
| 5.14 | Split | Train 70 / validation 15 / test 15; split by **time** to avoid leakage |
| 5.15 | Save | `ai/data/processed/*.csv` plus a short `ai/data/README.md` (source, licence, period) |

**Requirements covered:** FR-4.1 – FR-4.9, FR-5.1 – FR-5.5, ML-01 – ML-04 · FRD F3.1 – F3.4
**Exit criteria:** ✅ every route card shows a real calculated score and risk level · ✅ scoring unit tests pass · ✅ a reproducible dataset is saved

---

## Phase 6 – ML Model Training and Evaluation (Day 6)

**Goal:** a real, evaluated, versioned ML model.
**Why:** to show genuine ML: trained on data, compared with a baseline, and tested on held-out data. It must not just be the weighted score relabelled as AI.

| # | Step | Brief details |
|---|---|---|
| 6.1 | Baseline | Majority class or historical incident rate; record its metrics |
| 6.2 | Logistic Regression | Scaled features and `class_weight='balanced'` |
| 6.3 | Random Forest | Tune a small grid (`n_estimators`, `max_depth`) on the validation set |
| 6.4 | Evaluate | Precision, recall, F1, and ROC-AUC on the **test** set; confusion matrix |
| 6.5 | Check problems | Leakage (no future features), class imbalance, overfitting (train vs. test gap) |
| 6.6 | Feature importance | Top features, which help explain predictions |
| 6.7 | Select and save | `joblib.dump` the model, plus `model_meta.json` (version, date, metrics, features) |
| 6.8 | Document | `docs/ML_MODEL.md`: target, data, metrics table, limitations |

**Requirements covered:** ML-05 – ML-08
**Exit criteria:** ✅ the chosen model beats the baseline on F1 / ROC-AUC · ✅ the model and its metadata are saved · ✅ results are documented

> **Fallback:** if no usable dataset exists by the end of Day 5, keep the demo model clearly labelled "demonstration", and present the rule-based engine as the MVP with ML as an extension.

---

## Phase 7 – ML Integration (Day 7)

**Goal:** the AI estimate appears in the app from start to finish, with a safe fallback.
**Why:** a model that is not connected to the product cannot be demonstrated.

| # | Step | Brief details |
|---|---|---|
| 7.1 | FastAPI endpoints | `POST /predict` (Pydantic validation), `GET /health`, `GET /model-info` |
| 7.2 | Load the model once | Load at startup, not on every request |
| 7.3 | Node client | `services/aiService.ts`: Axios with a 3-second timeout; the URL comes from the environment |
| 7.4 | Feature mapping | Convert the route factors into the model's feature vector, in the same order and scale as training |
| 7.5 | Combine results | Add `aiEstimate {score, probability, modelVersion}` to each route |
| 7.6 | Fallback | On timeout or error → `aiEstimate: null` with a flag → UI badge "AI estimate unavailable" |
| 7.7 | UI | "AI risk estimate" chip next to the rule-based score; "How is this calculated?" popover |
| 7.8 | Admin telemetry | ML status (up or down) and latency in `/api/admin/stats` |
| 7.9 | Tests | Python: `/predict` happy path and invalid input. Node: fallback when the ML service is down |

**Requirements covered:** FR-6.1 – FR-6.5, ML-09 – ML-11 · FRD F4.1, F4.2
**Exit criteria:** ✅ a search shows the AI estimate · ✅ stopping the ML service → the app still works with the fallback badge

---

## Phase 8 – Safety UI, User and Admin Features (Day 8)

**Goal:** finish the product experience for all three roles, and deploy to staging.
**Why:** this turns a working engine into a complete application that can be demonstrated.

### 8A – Safety Analysis UI
| # | Step | Brief details |
|---|---|---|
| 8.1 | Score gauge | Circular 0–100 gauge with a text risk label (not colour alone) |
| 8.2 | Factor breakdown | Six bars, each with its score and one-line reason |
| 8.3 | Data panel | Coverage %, source and freshness for each factor, "Sample data" badge, disclaimer |
| 8.4 | Comparison chart | Bar chart of route scores (Recharts) |

### 8B – Emergency Features
| # | Step | Brief details |
|---|---|---|
| 8.5 | Facility markers | `GET /api/emergency-locations`; one icon per type; toggle filters |
| 8.6 | Emergency Mode | Always-visible button → numbers (112, 100, 108, 1091) with tap-to-call, and the 3 nearest facilities |

### 8C – User Dashboard
| # | Step | Brief details |
|---|---|---|
| 8.7 | Save history | Save automatically after a search when logged in (`RouteSearch` model) |
| 8.8 | History page | Paginated list, "View" replays the search on the map, delete with confirmation, ownership checked |
| 8.9 | Preferences | Maximum detour and default time; `GET` and `PUT /api/user/preferences` |

### 8D – Admin Dashboard
| # | Step | Brief details |
|---|---|---|
| 8.10 | Safety records | Table plus a create/edit form with Zod validation (factor, value 0–100, coordinates, source) |
| 8.11 | Weight configuration | Six sliders (0–50%), live total, save only at exactly 100%, reset to defaults |
| 8.12 | Audit log | Write on every admin create, update, or delete; read-only table |
| 8.13 | **Staging deployment** | Deploy the current `dev` branch to a preview URL and smoke-test it |

**Requirements covered:** FR-4.9, FR-7.x, FR-8.x, FR-9.2 – FR-9.6 · FRD Modules 5–7
**Exit criteria:** ✅ every role's workflow works · ✅ the staging URL is live

---

## Phase 9 – Testing, Security and Quality (Day 9)

**Goal:** the complete workflow works reliably in a fresh browser session.
**Why:** a feature that breaks during the demo counts against the project more than a missing one.

| # | Step | Brief details |
|---|---|---|
| 9.1 | Unit tests | Scoring engine ≥ 80% coverage; validators |
| 9.2 | API tests | Supertest: auth, history ownership, admin 403, validation 400 |
| 9.3 | E2E tests | Playwright: search → recommendation → save → history; admin login |
| 9.4 | Failure tests | Routing 429 or 500, empty results, ML down, network offline |
| 9.5 | Security review | Rate limits on search and auth, CORS origin, no secrets in the repo, no tokens in logs |
| 9.6 | Responsive pass | Check at 320, 360, 768, 1024, and 1440 px; no horizontal scroll; touch targets ≥ 40 px |
| 9.7 | Accessibility pass | Contrast, focus rings, keyboard navigation, alt and ARIA labels |
| 9.8 | Bug bash | Run FRD §13 test cases TC-01 – TC-16 and record pass or fail |

**Requirements covered:** NFR-1 – NFR-13
**Exit criteria:** ✅ CI is green · ✅ all TC-01 – TC-16 pass · ✅ no console errors

---

## Phase 10 – Deployment and Documentation (Day 10)

**Goal:** a working production deployment and a demonstration that can be repeated.
**Why:** evaluators and interviewers need a live link and clear documentation.

| # | Step | Brief details |
|---|---|---|
| 10.1 | Production environment | Set `MONGO_URI`, `JWT_*`, `ORS_API_KEY`, `SMTP_*`, `AI_SERVICE_URL`, `CORS_ORIGIN` |
| 10.2 | Deploy | Frontend and API on Vercel; ML service on Render/Railway or Docker |
| 10.3 | Verify on the live domain | Map tiles, geocoding, routing, cookies (`Secure`), CORS |
| 10.4 | Smoke test | The full journey on a second browser or device |
| 10.5 | Seed demo data | Admin account, demo user, safety records for the demo city |
| 10.6 | README | Summary, screenshots, features, setup, live link, limitations |
| 10.7 | Documentation | Architecture, API, safety-scoring specification, test results, deployment guide |
| 10.8 | Rehearse | A 7–10 minute run-through on the deployed app; prepare a backup video |
| 10.9 | Release | Merge `dev` → `main`; tag `v1.0.0` |

**Requirements covered:** BRD §20 acceptance criteria
**Exit criteria:** ✅ the live URL works from start to finish · ✅ README and docs complete · ✅ rehearsal done

---

## Optional Phase 11–12 – Improvement and Presentation

| Day | Focus | Steps |
|---|---|---|
| 11 | Improve data and model | Add more data sources; calibrate scores and thresholds; retrain; add route feedback |
| 12 | Presentation | Final fixes, demo video, slides, interview Q&A (see [PRESENTATION_SLIDES.md](PRESENTATION_SLIDES.md)) |

---

## 16. Git Workflow

```
main  ─────────────●──────────────────────────●  (stable, tagged releases)
                    \                        /
dev    ──●──●──●──●──●──●──●──●──●──●──●──●──    (integration)
          \    /  \    /
feature/   route   safety-score   ...            (one per feature)
```

1. Create an issue for each feature.
2. Branch `feature/<name>` from `dev`.
3. Commit in small steps (`feat:`, `fix:`, `docs:`, `test:`).
4. Open a pull request into `dev`; CI must pass.
5. Merge `dev` → `main` only for tested releases.

**Branch names:** `feature/map-search`, `feature/alt-routes`, `feature/safety-score`, `feature/ml-dataset`, `feature/ml-integration`, `feature/history`, `feature/emergency`, `feature/admin-data`.

---

## 17. Daily Routine

| Time | Activity |
|---|---|
| Start (15 min) | Review yesterday's exit criteria; pick today's steps |
| Build (5–6 h) | Vertical slices: API → UI → test |
| Integrate (1 h) | Merge into `dev`; run the full flow |
| End (15 min) | Update issue status; note blockers; commit |

---

## 18. Risk Checkpoints

| Checkpoint | Question | If no → action |
|---|---|---|
| End of Day 1 | Dataset chosen? | Switch to an OSM-derived proxy and label the ML as a demo |
| End of Day 4 | Multiple routes working? | Show a single route and focus on scoring |
| End of Day 5 | Scoring engine done? | Cut Could-have features; this is the main demo |
| End of Day 6 | Model beats the baseline? | Present an honest result; keep the rule-based engine primary |
| End of Day 8 | Staging live? | Stop new features; fix the deployment first |
| End of Day 9 | All Must-have tests pass? | Fix bugs only; no new work |

---

## 19. Definition of Done

A step or feature is **done** when:

- [ ] The code is merged into `dev` and CI passes
- [ ] Loading, error, and empty states are handled
- [ ] It works on mobile (360 px) and desktop
- [ ] Permissions are enforced on the backend (if relevant)
- [ ] At least one test covers it
- [ ] Sample or demo data is labelled in the UI
- [ ] Documentation is updated if the API or behaviour changed
