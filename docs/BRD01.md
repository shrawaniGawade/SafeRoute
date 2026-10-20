# Business Requirements Document (BRD)

**Project:** SafeRoute – AI-Powered Safety-Aware Route Recommendation System
**Document ID:** BRD01
**Version:** 1.0
**Date:** 11 October 2026
**Prepared by:** Pratik Dawane
**Status:** Draft for review
**Project type:** Full-stack web application (mapping, safety analytics, AI/ML risk prediction)

---

## Table of Contents

1. [Document Purpose](#1-document-purpose)
2. [Executive Summary](#2-executive-summary)
3. [Background and Problem Statement](#3-background-and-problem-statement)
4. [Business Objectives](#4-business-objectives)
5. [Project Scope](#5-project-scope)
6. [Stakeholders](#6-stakeholders)
7. [User Roles and Permissions](#7-user-roles-and-permissions)
8. [Business Requirements](#8-business-requirements)
9. [Safety Score Business Rules](#9-safety-score-business-rules)
10. [AI/ML Requirements](#10-aiml-requirements)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Data Requirements](#12-data-requirements)
13. [High-Level Solution Overview](#13-high-level-solution-overview)
14. [Assumptions](#14-assumptions)
15. [Constraints](#15-constraints)
16. [Dependencies](#16-dependencies)
17. [Risks and Mitigation](#17-risks-and-mitigation)
18. [Timeline and Milestones](#18-timeline-and-milestones)
19. [Success Criteria and KPIs](#19-success-criteria-and-kpis)
20. [Acceptance Criteria](#20-acceptance-criteria)
21. [Limitations and Disclaimers](#21-limitations-and-disclaimers)
22. [Glossary](#22-glossary)
23. [Approval](#23-approval)

---

## 1. Document Purpose

This document records the business requirements for SafeRoute. It covers:

- the problem the product addresses and why it matters,
- the objectives, scope, and expected benefits,
- the users, roles, and what each role may do,
- the business rules behind the Safety Score and the AI/ML component,
- the constraints, risks, timeline, and how success will be measured.

It is the reference for later documents: the SRS, FRD, architecture, API documentation, safety-scoring specification, and test plan.

---

## 2. Executive Summary

Most navigation apps choose routes mainly by **travel time and distance**. SafeRoute adds a **safety layer** to that choice.

When a user enters an origin and a destination, SafeRoute:

1. gets several alternative routes from a routing provider,
2. scores each route using the safety indicators that are available (lighting, crime and incident history, accident history, activity, time of day, and how close emergency services are),
3. produces a **Safety Score from 0 to 100** and a **risk level**,
4. recommends the best route that is still practical, within the user's limit on extra travel time, and
5. **explains** the recommendation factor by factor, including how much data was available and how recent it is.

A route that takes 16 minutes may be recommended over one that takes 14 minutes if its safety indicators are noticeably better and the extra time is within the user's tolerance.

The product is delivered as a **10-day MVP** (plus 2 optional days) and is intended as a working college project and a portfolio application for interviews.

> **Important:** A higher Safety Score means a route scored better under SafeRoute's model and data. It does **not** guarantee that the route is safe in the real world.

---

## 3. Background and Problem Statement

### 3.1 Background

Navigation services are very good at getting users to a destination quickly. They do not usually tell users anything about the personal-safety side of a route, which matters most at night, in unfamiliar areas, or for people travelling alone.

### 3.2 Problem Statement

People who care about their safety while travelling have no simple, comparable, and explainable way to weigh safety against travel time and distance when choosing a route.

### 3.3 Specific Pain Points

| # | Pain point | Impact on the user |
|---|---|---|
| P1 | No visibility of street lighting along a route | Users cannot judge how well lit a route is at night |
| P2 | Accident and safety records are scattered and hard to compare | Users cannot compare risk between routes |
| P3 | The shortest route may pass areas with few emergency facilities | Help may be slower to reach in an emergency |
| P4 | The right route can change with the time of day | A route that is fine at noon may not be the best choice at midnight |
| P5 | Navigation apps do not explain safety trade-offs | Users cannot see *why* one route might be better |

### 3.4 Proposed Solution

SafeRoute combines a mapping service, geographic and safety data, a **transparent weighted scoring engine**, and an **ML risk estimator** to compare routes and explain the result in plain language.

---

## 4. Business Objectives

| ID | Objective | Measure |
|---|---|---|
| BO-1 | Let users compare multiple routes on safety as well as distance and time | At least 2 alternatives shown whenever the provider returns them |
| BO-2 | Give every route an explainable, normalized Safety Score | 100% of displayed scores are calculated by the scoring engine, with a factor breakdown |
| BO-3 | Recommend a route that balances safety and practicality | The recommendation always respects the user's maximum detour setting |
| BO-4 | Be honest about data quality | Every score shows its data coverage and freshness; low coverage shows "Insufficient data" |
| BO-5 | Show that a real ML model has been trained, evaluated, and integrated | A model with documented metrics, a version, and a working prediction API |
| BO-6 | Provide secure, role-based access | Admin endpoints reject non-admin users on the server |
| BO-7 | Deliver a deployable, demonstrable product in 10 days | Deployed URL, README, demo walkthrough, and passing test suite |

---

## 5. Project Scope

### 5.1 In Scope – Core (must work)

- User registration, login, logout, and session management
- Origin and destination search (geocoding)
- Interactive map (OpenStreetMap + Leaflet)
- Alternative routes with distance and ETA
- Safety Score for every route, with a risk level
- Recommended route with a factor-level breakdown and explanation
- Saved route history (view and delete)
- Responsive UI for desktop and mobile

### 5.2 In Scope – Safety Features (with available data)

- Time-of-day adjustment
- Emergency service markers (hospitals, police stations, fire stations)
- Risk labels (Low / Moderate / High / Insufficient data)
- Weighted scoring algorithm whose weights can be configured
- Clear labels on sample or simulated data

### 5.3 In Scope – Advanced (if time permits)

- A trained ML risk-prediction model served through FastAPI
- Admin data management (safety records, emergency locations)
- Configuration of scoring weights within safe limits
- Route feedback from users
- Larger and broader datasets

### 5.4 Out of Scope

These will **not** be described as live features unless they are actually integrated:

- Real-time crowd density
- Complete street-light inventories
- Live crime alerts
- Guaranteed police response or real-time emergency dispatch
- Turn-by-turn voice navigation
- Native mobile apps (iOS/Android)

---

## 6. Stakeholders

| Stakeholder | Role / interest |
|---|---|
| Project developer | Builds, tests, deploys, and presents the application |
| Project guide / faculty evaluator | Assesses technical depth, completeness, and presentation |
| Interviewers / recruiters | Assess engineering, design, and reasoning skills |
| End users (guests and registered users) | Want safer, explained route choices |
| Administrators | Maintain safety data, scoring weights, and user accounts |
| Third-party providers | Map tiles, geocoding, routing, email delivery, hosting, database |

---

## 7. User Roles and Permissions

### 7.1 Roles

**Guest user (no account)**
- Open the landing page
- Search an origin and destination and view alternative routes
- Compare travel time, distance, and safety indicators
- View nearby emergency locations
- Register or log in to save routes

**Registered user**
- Register with email verification (OTP), log in, and log out
- Manage profile and safety preferences (time preference, maximum detour)
- Search, compare, and view detailed Safety Score breakdowns
- Save favourite destinations and route searches
- View and delete personal route history
- Use Emergency Mode and see emergency contact information

**Administrator**
- Use the admin dashboard
- View user and route-search statistics
- Create, edit, and deactivate user accounts where permitted
- Manage safety records and emergency-location data
- Review data imports and validation errors
- Configure scoring weights within safe limits
- View system logs, data freshness, and ML model status and metadata

### 7.2 Permission Matrix

| Feature | Guest | User | Admin |
|---|:---:|:---:|:---:|
| Search and compare routes | ✅ | ✅ | ✅ |
| View safety analysis | ✅ | ✅ | ✅ |
| View emergency locations | ✅ | ✅ | ✅ |
| Save route history | ❌ | ✅ | ✅ |
| Manage own profile and preferences | ❌ | ✅ | ✅ |
| Manage safety datasets | ❌ | ❌ | ✅ |
| Manage application users | ❌ | ❌ | ✅ |
| Change system scoring weights | ❌ | ❌ | ✅ |
| View system-wide statistics | ❌ | ❌ | ✅ |

> Permissions are enforced **on the backend** (authentication middleware plus an explicit role check), not only by hiding pages in the frontend.

---

## 8. Business Requirements

Priority: **M** = Must have, **S** = Should have, **C** = Could have.

### 8.1 Authentication and Accounts

| ID | Requirement | Priority |
|---|---|:---:|
| BR-01 | Users can register with name, email, and password | M |
| BR-02 | Passwords are stored only as hashes (bcrypt) | M |
| BR-03 | Users can log in and log out; sessions use short-lived access tokens and rotating refresh tokens | M |
| BR-04 | Duplicate registrations and invalid credentials are rejected with clear messages | M |
| BR-05 | Email verification and password reset use a one-time code (OTP) | S |
| BR-06 | Authentication endpoints are rate-limited | M |

### 8.2 Route Search and Navigation

| ID | Requirement | Priority |
|---|---|:---:|
| BR-07 | Users can search for origin and destination by place name (geocoding) | M |
| BR-08 | The system shows real route geometry from a routing provider on an interactive map | M |
| BR-09 | The system requests and shows alternative routes when the provider supports them | M |
| BR-10 | Each route shows distance and estimated travel time | M |
| BR-11 | Each route is drawn in a distinct style; the map and the selected route card stay in sync | M |
| BR-12 | Loading, error, no-route, and API-limit states are handled gracefully | M |

### 8.3 Safety Analysis and Recommendation

| ID | Requirement | Priority |
|---|---|:---:|
| BR-13 | Every route receives a Safety Score (0–100) calculated by the scoring engine | M |
| BR-14 | Every route receives a risk level (Low / Moderate / High / Insufficient data) | M |
| BR-15 | The system recommends one route using documented ranking rules | M |
| BR-16 | The recommended route shows a factor-level breakdown with short explanations | M |
| BR-17 | Missing data is treated as **unknown**, never automatically as safe | M |
| BR-18 | Data coverage and freshness are shown for every score | M |
| BR-19 | Scores change with the time of day under configured rules | S |
| BR-20 | Nearby emergency facilities are shown on the map from a documented source | S |
| BR-21 | A route comparison chart is shown | C |

### 8.4 User Features

| ID | Requirement | Priority |
|---|---|:---:|
| BR-22 | Logged-in users can save route searches | M |
| BR-23 | Users can view and delete their own route history (ownership is enforced) | M |
| BR-24 | Users can set preferences: time preference and maximum acceptable detour | S |
| BR-25 | Users can save favourite destinations | C |
| BR-26 | Emergency Mode gives quick access to verified public emergency numbers | S |

### 8.5 Administration

| ID | Requirement | Priority |
|---|---|:---:|
| BR-27 | Admins have a protected dashboard with basic statistics | M |
| BR-28 | Admins can create, read, update, and delete safety records, with validation | S |
| BR-29 | Admins can configure scoring weights within limits (each weight 0–50%, total exactly 100%) | S |
| BR-30 | Important admin actions are written to an audit log | S |
| BR-31 | Admins can view ML model status, version, and recent inference latency | C |
| BR-32 | Admins can manage user accounts (deactivate or change role) | C |

---

## 9. Safety Score Business Rules

### 9.1 Factors and Default Weights

This is a starting configuration, **not a scientifically validated formula**.

| Factor | Default weight | Higher score means |
|---|:---:|---|
| Street lighting | 25% | Better lighting records along the route |
| Historical crime/safety indicators | 25% | Fewer recorded incidents in the dataset |
| Accident risk | 20% | Fewer recorded accidents in the selected period |
| Crowd/activity indicators | 10% | Better activity proxy, if reliable data exists |
| Time-of-day conditions | 10% | More favourable under configured time rules |
| Emergency-service proximity | 10% | Emergency facilities are closer |
| **Total** | **100%** | |

### 9.2 Formula

Each factor is normalized to a value from 0 to 100, where higher is better.

```
Safety Score = Σ (wᵢ × sᵢ)

  wᵢ = weight of factor i, as a fraction (all weights sum to 1)
  sᵢ = normalized score of factor i (0–100)
```

### 9.3 Risk Levels

| Safety Score | Risk level |
|---|---|
| 75 – 100 | Low risk |
| 50 – 74 | Moderate risk |
| 0 – 49 | High risk |
| Coverage below threshold | Insufficient data |

Risk is never shown by colour alone. A text label and the number are always shown as well.

### 9.4 Recommendation Rules

1. Exclude routes whose duration exceeds the fastest route by more than the user's **maximum detour** (default: +25% or +10 minutes, whichever is smaller).
2. Exclude routes marked **Insufficient data** from being recommended (they are still displayed).
3. Recommend the eligible route with the **highest Safety Score**.
4. If two scores are within 2 points of each other, prefer the shorter travel time.
5. If no route is eligible, recommend nothing and tell the user why.

### 9.5 Missing Data and Credibility Rules

- A missing factor is **unknown**. Its weight is redistributed across the available factors, and coverage is reduced to match.
- If coverage is below **60%** of the total weight, show "Insufficient data" instead of a precise score.
- Sample or simulated data is labelled as such in the UI.
- Crime reports and crowd data are not presented as covering all incidents or all people.

---

## 10. AI/ML Requirements

### 10.1 Purpose

The ML component estimates **incident risk** from historical, labelled data. It complements the weighted scoring engine and does not replace it. The weighted score on its own is **not** presented as AI.

### 10.2 Requirements

| ID | Requirement | Priority |
|---|---|:---:|
| ML-01 | Use a documented, historical, labelled incident dataset | M |
| ML-02 | Define the prediction target clearly (e.g. incident-risk category for an area and time window) | M |
| ML-03 | Clean the data, handle missing values, and engineer features (time, location, historical counts) | M |
| ML-04 | Split data into training, validation, and test sets with no leakage | M |
| ML-05 | Train a Logistic Regression baseline and at least one stronger model (e.g. Random Forest) | M |
| ML-06 | Compare against a simple baseline (majority class or historical rate) | M |
| ML-07 | Report precision, recall, F1, and a ranking metric (e.g. ROC-AUC); address class imbalance | M |
| ML-08 | Save the selected model together with its version, training date, and metrics | M |
| ML-09 | Serve predictions through a FastAPI `/predict` endpoint | M |
| ML-10 | The Node.js backend calls the ML service and falls back to the rule-based score if the call fails | M |
| ML-11 | The UI shows the model's output, model version, and limitations | S |

### 10.3 Three-Day ML Plan

| Day | Focus | Output |
|---|---|---|
| Day 5 | Dataset selection, cleaning, features, data split | A validated, reproducible training dataset |
| Day 6 | Model training, baseline comparison, evaluation, leakage checks | A trained model with documented metrics |
| Day 7 | FastAPI service, Node.js integration, UI display | A working end-to-end prediction flow |

> **Main risk:** finding the dataset. A suitable dataset must be chosen on Day 1 of the overall project.

---

## 11. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Route search with scoring returns within about 5 seconds in normal conditions; ML inference within about 500 ms |
| **Security** | Hashed passwords; JWT authentication; server-side role checks; Zod input validation; rate limiting; Helmet headers; HTTPS in production; CORS limited to the frontend origin; secrets kept in environment variables |
| **Privacy** | No passwords, tokens, or sensitive personal data in logs; users can delete their history |
| **Usability** | Map-first layout; sidebar on desktop, bottom sheet on mobile; touch-friendly controls; plain-language explanations |
| **Accessibility** | Sufficient contrast; risk shown with text and numbers, not colour alone; keyboard navigation; visible focus states |
| **Responsiveness** | Works from 320 px to 1920 px wide with no horizontal scrolling |
| **Reliability** | Graceful fallbacks when map, routing, or ML services fail; skeleton loaders and clear error and empty states |
| **Maintainability** | TypeScript on the frontend and backend; feature-based folders; linting; automated tests (Vitest/Supertest) |
| **Portability** | Reproducible setup with `.env.example`; deployable to Vercel or Docker |
| **Compliance** | Follow OpenStreetMap attribution and the usage policies of the tile, geocoding, and routing providers |

---

## 12. Data Requirements

### 12.1 Main Collections (MongoDB)

| Collection | Key fields | Purpose |
|---|---|---|
| `users` | name, email, passwordHash, role, isVerified, preferences, createdAt | Accounts, roles, embedded preferences |
| `refreshTokens` | userId, tokenHash, expiresAt, revoked | Session rotation (TTL index) |
| `otps` | email, codeHash, purpose, attempts, expiresAt | Email verification and password reset (TTL index) |
| `routeSearches` | userId, origin, destination, routes, scores, createdAt | Route history |
| `safetyRecords` | location (GeoJSON), factor, value, source, updatedAt | Safety indicators |
| `emergencyLocations` | name, type, location (GeoJSON), source | Hospitals, police stations, fire stations |
| `auditLogs` | actorId, action, target, createdAt | Record of admin actions |

Geographic records use **GeoJSON with coordinates in longitude, latitude order** and a `2dsphere` index for proximity queries.

### 12.2 Data Sources

| Data | Candidate source | Label in UI |
|---|---|---|
| Map tiles, geocoding | OpenStreetMap / Nominatim | Live (third-party) |
| Routes and alternatives | openrouteservice or OSRM | Live (third-party) |
| Emergency facilities | OpenStreetMap (Overpass: `amenity=hospital/police/fire_station`) | Source plus last-updated date |
| Lighting | OSM `lit=*` tags or sample data | "Sample" where simulated |
| Crime/incident history | Public open dataset (documented) | Source plus period covered |
| Accident history | Public open dataset (documented) | Source plus period covered |

---

## 13. High-Level Solution Overview

```
[ React + TypeScript Frontend ]
  Landing · Search · Map · Route comparison · Dashboards
              │  HTTPS / JSON
              ▼
[ Express + TypeScript REST API ]
  Auth · Authorization · Validation · Rate limiting
     ├── Route service ──────> Geocoding / Routing provider
     ├── Safety engine ──────> Feature extraction · Weighted scoring · Explanations
     ├── ML client ──────────> [ FastAPI ML Service (scikit-learn) ]
     └── Data layer ─────────> [ MongoDB Atlas ]
```

**Flow:**
1. The user enters an origin and a destination.
2. The backend geocodes them and asks the routing provider for alternative routes.
3. For each route, the safety engine collects nearby safety records and emergency facilities.
4. The weighted scoring engine and the ML risk estimate are calculated.
5. Routes are ranked under the recommendation rules, and explanations are generated.
6. The frontend draws the routes and shows the comparison panel.
7. For logged-in users, the search is saved to their history.

---

## 14. Assumptions

- The routing provider returns alternative routes for most city-scale searches.
- At least one usable public, labelled incident or accident dataset can be obtained for the demo region.
- Free tiers of the map, routing, database, and hosting services are enough for development and the demo.
- The developer can work about 6–8 focused hours a day.
- The demo covers one city or region rather than nationwide coverage.

---

## 15. Constraints

| Type | Constraint |
|---|---|
| Time | 10 days of development, plus 2 optional days |
| Team | One developer |
| Budget | Free or low-cost tiers only |
| API limits | Rate limits and attribution rules on the routing, geocoding, and tile services |
| Data | Safety data may be partial, outdated, or simulated in places |
| Technology | One consistent stack: React/TS, Express/TS, MongoDB, Python/scikit-learn |

---

## 16. Dependencies

- OpenStreetMap tiles and Nominatim geocoding
- openrouteservice (or an equivalent routing API) and its API key
- MongoDB Atlas
- An SMTP or email provider for OTP emails
- A hosting platform (Vercel or Docker on a VPS)
- Public safety and accident datasets
- GitHub (version control) and GitHub Actions (CI)

---

## 17. Risks and Mitigation

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|:---:|:---:|---|
| R1 | No suitable labelled dataset is found | Medium | High | Choose the dataset on Day 1; keep the rule-based engine as a clearly labelled fallback |
| R2 | Routing API limits or downtime | Medium | High | Cache results; show clear API-limit states; keep a backup provider |
| R3 | Too few route alternatives returned | Medium | Medium | Show a single route clearly; explain that alternatives depend on the provider |
| R4 | Users read the score as a safety guarantee | Medium | High | Show a disclaimer, coverage, and freshness; label sample data |
| R5 | The ML model overfits or leaks data | Medium | Medium | Hold-out test set, baseline comparison, leakage checks |
| R6 | Scope creep threatens the deadline | High | High | Build the MVP first; treat advanced items as optional |
| R7 | Deployment problems on demo day | Medium | High | Staging deployment by Day 8–9; rehearse on the deployed URL |
| R8 | Security weaknesses (e.g. broken access control) | Low | High | Server-side role checks, validation, rate limiting, automated permission tests |

---

## 18. Timeline and Milestones

| Day | Phase | Key deliverable |
|---|---|---|
| 1 | Foundation | Repo, stack setup, base layout; frontend talks to backend; dataset identified |
| 2 | Authentication | Register, login, roles; admin endpoints reject unauthorized requests |
| 3 | Maps | Location search and a working route shown on the map |
| 4 | Navigation | Alternative routes, route cards, error and limit states |
| 5 | AI/ML – Data (+ scoring engine) | Clean dataset and features; weighted scoring implemented |
| 6 | AI/ML – Training | Trained and evaluated model with documented metrics |
| 7 | AI/ML – Integration | FastAPI `/predict` connected to the backend and shown in the UI |
| 8 | Safety UI and Admin | Breakdown and recommendation UI; admin dashboard and data management; **staging deployed** |
| 9 | Quality | Tests, security hardening, responsive fixes |
| 10 | Release | Production deployment, README, screenshots, rehearsal |
| 11 *(optional)* | Improvement | Better data coverage and score calibration |
| 12 *(optional)* | Presentation | Final fixes, demo video, interview preparation |

---

## 19. Success Criteria and KPIs

| KPI | Target |
|---|---|
| End-to-end search flow (search → routes → scores → recommendation) | Works on desktop and mobile |
| Scores consistent with the formula | 100% match in unit tests |
| Role-permission tests | All pass (no admin access for user or guest) |
| ML model performance | Better than the baseline on F1 / ROC-AUC on the held-out test set |
| Automated test suite | All tests pass in CI |
| Route search response time | ≤ 5 s typical |
| Demo | A 7–10 minute live demo on the deployed URL completed without failure |

---

## 20. Acceptance Criteria

The product is accepted when all of the following are true:

- [ ] A new user can register and log in.
- [ ] A user can search for an origin and a destination.
- [ ] The application shows real route geometry from a routing provider.
- [ ] Multiple routes can be compared when the provider supports alternatives.
- [ ] Safety scores are calculated using the implemented formula and available data.
- [ ] The recommendation and factor-level explanation match those scores.
- [ ] Missing data is labelled unknown or insufficient.
- [ ] Nearby emergency locations are shown from a documented source.
- [ ] Logged-in users can save and retrieve route history.
- [ ] Administrator-only features are protected on the backend.
- [ ] The ML prediction flow works end to end, with a fallback.
- [ ] The application works on desktop and mobile.
- [ ] The deployed application works with production environment variables.
- [ ] The README, screenshots, limitations, and demo flow are ready.

---

## 21. Limitations and Disclaimers

- The Safety Score reflects **the available data and the configured model only**. It does not guarantee real-world safety.
- Crime and accident datasets record **reported** incidents only and may be incomplete or outdated.
- Coverage of lighting and activity data may be partial or simulated. This is labelled in the UI.
- The ML model is a focused, educational model and has not been validated for production use.
- Emergency Mode lists public emergency numbers only. It does **not** dispatch emergency services.

---

## 22. Glossary

| Term | Meaning |
|---|---|
| **Safety Score** | Weighted 0–100 score of a route's safety indicators; higher is better |
| **Factor** | One safety indicator (lighting, crime, accident, activity, time, emergency proximity) |
| **Normalization** | Converting a raw indicator to a common 0–100 scale |
| **Coverage** | Share of the total factor weight backed by real data for a route |
| **Freshness** | How recently the underlying data was updated |
| **Max detour** | The extra travel time a user will accept for a safer route |
| **ETA** | Estimated time of arrival / travel duration |
| **Geocoding** | Converting a place name into coordinates |
| **RBAC** | Role-based access control |
| **JWT** | JSON Web Token, used for authentication |
| **OTP** | One-time password, used for email verification and password reset |
| **MVP** | Minimum viable product |

---

## 23. Approval

| Name | Role | Signature | Date |
|---|---|---|---|
| Pratik Dawane | Developer / Author | | |
| | Project Guide | | |
| | Evaluator | | |
