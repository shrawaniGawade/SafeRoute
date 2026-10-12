# Software Requirements Specification (SRS)

**Project:** SafeRoute – AI-Powered Safety-Aware Route Recommendation System
**Document ID:** SRS01
**Version:** 1.0
**Date:** 11 October 2026
**Prepared by:** Pratik Dawane
**Related documents:** [BRD01](BRD01.md) · [FRD01](FRD01.md) · [API Documentation](API_DOCUMENTATION.md)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features (Functional Requirements)](#3-system-features-functional-requirements)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Data Requirements](#6-data-requirements)
7. [System Constraints](#7-system-constraints)
8. [Assumptions and Dependencies](#8-assumptions-and-dependencies)
9. [Traceability Matrix](#9-traceability-matrix)
10. [Glossary](#10-glossary)

---

## 1. Introduction

### 1.1 Purpose
This SRS defines **what the SafeRoute software must do** (functional requirements) and **how well it must do it** (non-functional requirements). It turns the business needs in [BRD01](BRD01.md) into requirements that developers can build and testers can check.

### 1.2 Intended Audience
| Reader | Use of this document |
|---|---|
| Developer | Builds features against numbered requirements |
| Tester | Writes test cases from each requirement |
| Project guide / evaluator | Checks completeness and technical correctness |
| Interviewer | Understands system design and scope |

### 1.3 Product Scope
SafeRoute is a web application. It takes an origin and a destination, gets alternative routes, gives each route a **Safety Score (0–100)** using a weighted scoring engine and an ML risk model, recommends the best practical route, and explains why. It also has user accounts, route history, and an admin dashboard.

### 1.4 Definitions
See the [Glossary](#10-glossary). Requirement IDs use these formats:
- `FR-x.y`: functional requirement
- `NFR-x`: non-functional requirement
- `BR-xx`: business requirement in the BRD

---

## 2. Overall Description

### 2.1 Product Perspective
SafeRoute is a new, self-contained system with four parts:

```
[ React + TS Frontend ] ──HTTPS/JSON──> [ Express + TS API ] ──> [ MongoDB Atlas ]
                                              │
                                              ├──> [ FastAPI ML Service ]
                                              ├──> [ Routing / Geocoding API ]
                                              └──> [ SMTP Email Service ]
```

**What each part does:** the frontend handles only display and user input. The backend owns authentication, authorization, scoring, and all calls to external services, so secrets never reach the browser. The ML service is separate, so the Python model can change without touching the Node.js code.

### 2.2 Product Functions (Summary)
1. Account management (register, OTP verification, login, logout, password reset)
2. Location search and interactive map
3. Alternative routes with distance and ETA
4. Safety scoring, risk levels, recommendation, and explanation
5. ML risk prediction with a rule-based fallback
6. Emergency locations and Emergency Mode
7. Route history and user preferences
8. Admin dashboard, user management, safety data, and scoring weights

### 2.3 User Classes
| Class | Description | Access level |
|---|---|---|
| Guest | Visitor without an account | Search and view only |
| Registered user | Verified account holder | Adds history, preferences, and Emergency Mode |
| Administrator | System manager | Full management through `/api/admin` |

### 2.4 Operating Environment
- **Client:** Current versions of Chrome, Edge, Firefox, and Safari on desktop and mobile, at widths from 320 px to 1920 px
- **Server:** Node.js 20+ (Express 5), Python 3.10+ (FastAPI)
- **Database:** MongoDB Atlas (Mongoose 9)
- **Hosting:** Vercel (multi-service) or Docker

### 2.5 Design and Implementation Constraints
- One consistent stack: React 19 + TypeScript + Vite, Express + TypeScript, MongoDB, Python + scikit-learn.
- Must stay within free-tier API limits and follow OpenStreetMap attribution rules.
- Coordinates are stored as GeoJSON in **[longitude, latitude]** order.

---

## 3. System Features (Functional Requirements)

Each feature has a short explanation followed by its requirements. Priorities: **M** = Must, **S** = Should, **C** = Could.

### 3.1 Authentication and Session Management
**Explanation:** Users need secure accounts so they can save history and so the admin features can be protected. The system uses a short-lived access token kept in memory and a refresh token in an `httpOnly` cookie, which together lower the risk of token theft.

| ID | Requirement | Priority |
|---|---|:---:|
| FR-1.1 | The system shall register a user with name, email, and password (minimum 8 characters, including letters and numbers). | M |
| FR-1.2 | The system shall hash passwords with bcrypt before storing them. | M |
| FR-1.3 | The system shall send a 6-digit OTP by email to verify the account (expires in 10 minutes, at most 5 attempts, 60-second cooldown before resending). | S |
| FR-1.4 | The system shall issue an access token (15 minutes) and a refresh token (7 days, `httpOnly` cookie) when login succeeds. | M |
| FR-1.5 | The system shall rotate the refresh token on every refresh and revoke it if it is reused. | M |
| FR-1.6 | The system shall reject duplicate emails and invalid credentials with a generic message. | M |
| FR-1.7 | The system shall support forgot and reset password through an OTP, without revealing whether an email is registered. | S |
| FR-1.8 | The system shall return the current user's profile from `GET /api/auth/me`. | M |
| FR-1.9 | The system shall rate-limit the login, registration, and OTP endpoints. | M |

### 3.2 Location Search and Map
**Explanation:** The map is the main screen. Place names have to be converted to coordinates (geocoding) before routes can be requested.

| ID | Requirement | Priority |
|---|---|:---:|
| FR-2.1 | The system shall suggest locations as the user types (debounced, at least 3 characters). | M |
| FR-2.2 | The system shall convert the selected origin and destination into coordinates. | M |
| FR-2.3 | The system shall show an interactive OpenStreetMap map with zoom, pan, and attribution. | M |
| FR-2.4 | The system shall place markers at the origin and the destination. | M |
| FR-2.5 | The system shall let the user use the current location as the origin (with browser permission). | C |

### 3.3 Route Generation and Comparison
**Explanation:** Routes can only be compared on safety if there are several to compare. The system asks the routing provider for alternatives and shows them side by side.

| ID | Requirement | Priority |
|---|---|:---:|
| FR-3.1 | The system shall request up to 3 alternative routes from the routing provider. | M |
| FR-3.2 | The system shall show each route's geometry on the map in its own colour and line style. | M |
| FR-3.3 | The system shall show distance (km) and ETA (minutes) on each route card. | M |
| FR-3.4 | The system shall keep the selected route card and the highlighted map route in sync. | M |
| FR-3.5 | The system shall show distinct loading, error, no-route, and rate-limit states. | M |

### 3.4 Safety Scoring Engine
**Explanation:** This is the main feature that sets SafeRoute apart. Each route is scored on six factors. Each factor is normalized to a 0–100 scale and then multiplied by its weight. The formula is transparent, so it can be explained and tested.

`Safety Score = Σ (weightᵢ × factorScoreᵢ)`

| ID | Requirement | Priority |
|---|---|:---:|
| FR-4.1 | The system shall sample points along each route (about every 200 m) to extract features. | M |
| FR-4.2 | The system shall compute six factor scores from 0 to 100: lighting, crime, accident, activity, time of day, and emergency proximity. | M |
| FR-4.3 | The system shall apply the configured weights (default 25/25/20/10/10/10), which must total 100%. | M |
| FR-4.4 | The system shall treat missing factors as **unknown**, redistribute their weight across the available factors, and report coverage %. | M |
| FR-4.5 | The system shall show "Insufficient data" when coverage is below 60%. | M |
| FR-4.6 | The system shall classify risk: ≥75 Low, 50–74 Moderate, <50 High. | M |
| FR-4.7 | The system shall adjust the time-of-day factor using the departure time (day, evening, or night rules). | S |
| FR-4.8 | The system shall generate a one-line explanation for each factor. | M |
| FR-4.9 | The system shall show data source and freshness for each factor. | M |

### 3.5 Recommendation
**Explanation:** The safest route is not always practical. The system first removes routes that are too slow, then picks the highest score among the rest.

| ID | Requirement | Priority |
|---|---|:---:|
| FR-5.1 | The system shall exclude routes that exceed the fastest route by more than the user's maximum detour. | M |
| FR-5.2 | The system shall exclude routes marked "Insufficient data" from being recommended. | M |
| FR-5.3 | The system shall recommend the eligible route with the highest score; ties within 2 points go to the shorter ETA. | M |
| FR-5.4 | The system shall show the reason for the recommendation (e.g. "+2 min, +29 safety points"). | M |
| FR-5.5 | The system shall tell the user when no route is eligible. | M |

### 3.6 ML Risk Prediction
**Explanation:** A scikit-learn model trained on historical incident data estimates risk. It supports the weighted score but does not replace it. If the ML service is unavailable, the app keeps working with the rule-based score.

| ID | Requirement | Priority |
|---|---|:---:|
| FR-6.1 | The ML service shall provide `POST /predict`, which returns a risk estimate, a probability, and the model version. | M |
| FR-6.2 | The backend shall call the ML service through `POST /api/safety/predict` with a timeout of 3 seconds or less. | M |
| FR-6.3 | The backend shall fall back to the rule-based score and label it when the ML service fails. | M |
| FR-6.4 | The UI shall show the model name, version, data type (real or demo), and a limitation warning. | S |
| FR-6.5 | The ML service shall provide `GET /health` and `GET /model-info` (metrics, training date). | S |

### 3.7 Emergency Services and Emergency Mode
**Explanation:** Being close to help is one of the safety factors, and it is also useful information in its own right. Emergency Mode gives fast access to public emergency numbers.

| ID | Requirement | Priority |
|---|---|:---:|
| FR-7.1 | The system shall return hospitals, police stations, and fire stations within a given radius of a route. | S |
| FR-7.2 | The map shall show these facilities with icons for each type and a source label. | S |
| FR-7.3 | Emergency Mode shall show verified public emergency numbers (e.g. 112) and the nearest facilities. | S |
| FR-7.4 | The system shall not claim to dispatch emergency services. | M |

### 3.8 Route History and Preferences
**Explanation:** Registered users can return to past searches and set how much extra time they will accept for a safer route.

| ID | Requirement | Priority |
|---|---|:---:|
| FR-8.1 | The system shall save a search (origin, destination, routes, scores) for logged-in users. | M |
| FR-8.2 | The system shall list the user's own history, newest first, with pagination. | M |
| FR-8.3 | The system shall delete a history item only if it belongs to the requesting user. | M |
| FR-8.4 | The system shall store preferences: maximum detour (%/min) and default travel time. | S |
| FR-8.5 | The system shall store favourite destinations. | C |

### 3.9 Administration
**Explanation:** Admins keep the data and configuration correct. Every admin endpoint checks the role on the server.

| ID | Requirement | Priority |
|---|---|:---:|
| FR-9.1 | The system shall restrict `/api/admin/*` to authenticated users with `role = admin` (otherwise 401 or 403). | M |
| FR-9.2 | The system shall show statistics: users, searches, ML service status, and inference latency. | M |
| FR-9.3 | The system shall let admins change a user's role and delete users, but not themselves. | S |
| FR-9.4 | The system shall support create, read, update, and delete of safety records, with validation. | S |
| FR-9.5 | The system shall let admins update weights (each 0–50%, total exactly 100%). | S |
| FR-9.6 | The system shall write an audit log entry for every admin create, update, or delete action. | S |

---

## 4. External Interface Requirements

### 4.1 User Interfaces
| Screen | Main elements |
|---|---|
| Landing page | Introduction, origin and destination inputs, feature overview, login and register |
| Route planner | Map (main area), route cards (sidebar on desktop, bottom sheet on mobile), score gauge |
| Safety analysis panel | Overall score, risk label, factor bars, explanations, coverage and freshness |
| User dashboard | Recent searches, saved destinations, preferences |
| Admin dashboard | Statistics, users, safety records, weight configuration, ML status |
| Auth modal | Login, register, OTP, forgot and reset password forms |

UI rules: skeleton loaders for data, risk shown with text and numbers (not colour alone), visible focus states, and no horizontal scrolling at 320 px.

### 4.2 Software Interfaces
| System | Purpose | Interface |
|---|---|---|
| openrouteservice / OSRM | Routes and alternatives | REST, API key on the server |
| Nominatim | Geocoding | REST, rate-limited |
| OSM tile server | Map tiles | HTTPS tiles with attribution |
| Overpass API | Emergency facilities | REST (cached in MongoDB) |
| FastAPI ML service | Risk prediction | Internal REST (JSON) |
| MongoDB Atlas | Persistence | Mongoose driver |
| SMTP (Nodemailer) | OTP emails | SMTP over TLS |

### 4.3 API Summary
| Method | Endpoint | Access | Status |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Implemented |
| POST | `/api/auth/verify-otp` · `/resend-otp` | Public | Implemented |
| POST | `/api/auth/login` · `/logout` · `/refresh-token` | Public / Cookie | Implemented |
| POST | `/api/auth/forgot-password` · `/reset-password` | Public | Implemented |
| GET | `/api/auth/me` | User | Implemented |
| POST | `/api/safety/predict` | Public | Implemented |
| GET | `/api/admin/stats` | Admin | Implemented |
| PATCH | `/api/admin/users/:id/role` | Admin | Implemented |
| DELETE | `/api/admin/users/:id` | Admin | Implemented |
| POST | `/api/routes/search` | Public | Planned |
| GET / DELETE | `/api/routes/history` · `/:id` | User | Planned |
| GET | `/api/emergency-locations` | Public | Planned |
| GET / PUT | `/api/user/preferences` | User | Planned |
| CRUD | `/api/admin/safety-records` | Admin | Planned |
| GET / PUT | `/api/admin/weights` | Admin | Planned |

### 4.4 Communication Interfaces
All traffic uses HTTPS and JSON. CORS is limited to the frontend origin. Cookies use `httpOnly`, `Secure`, and `SameSite=Lax`.

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Performance | Route search with scoring returns in ≤ 5 s (p90); ML inference in ≤ 500 ms |
| NFR-2 | Performance | The first page load is interactive in ≤ 3 s on a 4G connection |
| NFR-3 | Security | Passwords are hashed with bcrypt; there are no plaintext secrets in code or logs |
| NFR-4 | Security | All input is validated with Zod; invalid input returns 400 with field errors |
| NFR-5 | Security | Helmet headers, rate limiting, and HTTPS are used in production |
| NFR-6 | Security | Authorization (role and ownership) is enforced on the server for every protected endpoint |
| NFR-7 | Reliability | Failures of external APIs or the ML service degrade gracefully, with a fallback and a user message |
| NFR-8 | Availability | 95% uptime during the evaluation and demo window |
| NFR-9 | Usability | The main task (search → recommendation) takes 3 interactions or fewer |
| NFR-10 | Accessibility | Meets WCAG 2.1 AA contrast; keyboard operable; risk is not shown by colour alone |
| NFR-11 | Responsiveness | Layout works from 320 px to 1920 px |
| NFR-12 | Maintainability | TypeScript strict mode, feature-based folders, linting in CI |
| NFR-13 | Testability | Scoring engine unit coverage ≥ 80%; auth and admin covered by Supertest |
| NFR-14 | Portability | `.env.example` is provided; the app runs locally and on Vercel or Docker |
| NFR-15 | Transparency | Every score shows coverage, freshness, and a disclaimer |

---

## 6. Data Requirements

### 6.1 Logical Data Model
```
User 1 ──── * RouteSearch
User 1 ──── * RefreshToken
User 1 ──── * AuditLog (as actor)
SafetyRecord   (GeoJSON Point, 2dsphere index)
EmergencyLocation (GeoJSON Point, 2dsphere index)
Otp (TTL index)
```

### 6.2 Key Entities
| Entity | Key attributes |
|---|---|
| User | `_id, name, email (unique), passwordHash, role (user/admin), isVerified, preferences{maxDetour, timePref}, createdAt` |
| RouteSearch | `userId, origin{name, coords}, destination{...}, routes[{distance, duration, score, factors, risk}], recommendedIndex, createdAt` |
| SafetyRecord | `location, factor, value (0–100), source, isSample, updatedAt` |
| EmergencyLocation | `name, type (hospital/police/fire), location, phone?, source` |
| RefreshToken | `userId, tokenHash, expiresAt, revoked` |
| Otp | `email, codeHash, purpose, attempts, expiresAt` |
| AuditLog | `actorId, action, target, before, after, createdAt` |

### 6.3 Data Retention
- OTPs and refresh tokens are removed automatically through TTL indexes.
- Route history is kept until the user deletes it.
- Audit logs are kept for the project's duration.

---

## 7. System Constraints

- 10-day build by one developer.
- Free-tier API quotas: Nominatim allows about 1 request per second, and openrouteservice has a daily quota.
- Safety data may be partial or sample data and must be labelled.
- The ML model is educational and has not been validated for production.

---

## 8. Assumptions and Dependencies

- The routing provider returns alternatives for most urban searches.
- A public labelled incident or accident dataset exists for the demo city.
- MongoDB Atlas, the SMTP provider, and the hosting free tiers remain available.
- Users allow cookies (they are needed for the refresh token).

---

## 9. Traceability Matrix

| BRD requirement | SRS requirement(s) |
|---|---|
| BR-01 – BR-06 (Auth) | FR-1.1 – FR-1.9 |
| BR-07 – BR-12 (Routes) | FR-2.x, FR-3.x |
| BR-13 – BR-21 (Safety) | FR-4.x, FR-5.x, FR-7.x |
| BR-22 – BR-26 (User) | FR-7.3, FR-8.x |
| BR-27 – BR-32 (Admin) | FR-9.x |
| ML-01 – ML-11 | FR-6.x |

---

## 10. Glossary

| Term | Meaning |
|---|---|
| Safety Score | Weighted 0–100 score of a route's safety factors |
| Coverage | % of factor weight backed by real data |
| Max detour | Extra time a user will accept for a safer route |
| ETA | Estimated travel time |
| RTR | Refresh Token Rotation |
| TTL index | MongoDB index that deletes documents after they expire |
| p90 | The 90th-percentile response time |
