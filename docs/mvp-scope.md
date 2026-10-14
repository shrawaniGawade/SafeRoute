# 🎯 SafeRoute MVP Scope & Feature Matrix

> **Document Version**: 1.0.0  
> **Status**: Current Implementation Baseline & Roadmap  
> **Scope Strategy**: Build upon the existing working architecture without regressions; clearly delineate existing vs. proposed functionality.

---

## 1. Executive Summary

SafeRoute is architected as an AI-powered safety navigation platform. The MVP focuses on validating the core value proposition: **evaluating dynamic safety variables to produce an accurate 0–100 safety score and providing secure role-based portals for commuters and administrators.**

---

## 2. Feature Comparison: Existing vs. Proposed

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SafeRoute Feature State                         │
├───────────────────────────────────┬────────────────────────────────────┤
│   EXISTING & VERIFIED (MVP)       │     PROPOSED & NEXT-PHASE (V1.5/V2)│
├───────────────────────────────────┼────────────────────────────────────┤
│ • Full-Page Login Portal          │ • Interactive Mapbox/Leaflet Map   │
│ • Public Overview Landing Page    │ • Real-World Turn-by-Turn GPS      │
│ • Traveler Route Planner UI       │ • Live Police FIR Scraper Feed     │
│ • Admin Command Center            │ • User Route Bookmark Persistence  │
│ • Random Forest AI Inference      │ • Native Mobile Apps (React Native)│
│ • In-Memory AI Resilient Fallback │ • Community Hazard Incident Reports│
│ • MongoDB + In-Memory Fallback    │ • Social OAuth (Google / GitHub)   │
│ • 6-Digit Email OTP Verification  │ • Real-time Street CCTV Feeds      │
│ • JWT Refresh Token Rotation      │ • SMS / WhatsApp OTP Notifications │
│ • 31 Passing Backend Unit/E2E     │ • Turn-by-turn Audio Directions    │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 3. MoSCoW Prioritization Matrix

### 3.1 Must-Have (P0 – MVP Baseline) — *100% Implemented*
- [x] **Secure User Authentication**: Email/password registration, bcryptjs password hashing (12 salt rounds), login, and logout.
- [x] **OTP Verification**: Cryptographic 6-digit verification code with SHA-256 database hashing and 10-minute expiration.
- [x] **Token Management**: 15-minute access token in memory + 7-day refresh token in HttpOnly cookie with rotation (RTR) and theft detection.
- [x] **Multi-Factor AI Safety Scoring**: 4-factor scoring engine (Lighting, Crime, Accident, Crowd) evaluating routes on a 0–100 scale.
- [x] **Role-Based Access Control (RBAC)**: Enforced separation between regular travelers (`user`) and system managers (`admin`).
- [x] **Dedicated Screens**:
  - `#/login`: Full-page initial landing auth screen with responsive tabs.
  - `#/landing`: Public overview with feature breakdown and interactive GSAP canvas.
  - `#/app`: Traveler route safety planner with preset tuning.
  - `#/admin`: Standalone Admin Command Center with telemetry, user CRUD, and live AI probe.
- [x] **Automated Test Suite**: 31 backend unit and e2e integration tests passing with 0 failures.

### 3.2 Should-Have (P1 – Enhanced Usability) — *Next Phase (V1.5)*
- [ ] **Interactive Map Integration**: Embed Leaflet.js or Mapbox GL JS inside `UserDashboard.tsx` to visualize origin/destination markers and route paths visually instead of textual representation.
- [ ] **Route History Persistence**: Add `SavedRoute` Mongoose model and `/api/routes/saved` endpoint so authenticated users can review past evaluated routes.
- [ ] **Geocoding & Autocomplete**: Integrate Nominatim (OpenStreetMap) or Mapbox Geocoding for automatic address suggestions in source/destination inputs.

### 3.3 Could-Have (P2 – Advanced Enhancements) — *Phase V2.0*
- [ ] **Community Hazard Reporting**: Allow authenticated users to flag temporary hazards (e.g., broken streetlights, road construction, suspicious activity) on the route planner.
- [ ] **Social Authentication**: Google and GitHub OAuth 2.0 integration alongside standard email/password.
- [ ] **Push Notifications**: Web push alerts for emergency notices or significant safety score changes along frequently traveled routes.

### 3.4 Won't-Have (Out of Scope for MVP)
- ❌ **Live Police FIR Web Scraping**: Requires legal clearances, dynamic scrapers, and unstructured NLP parsing; replaced in MVP with normalized municipal crime indices.
- ❌ **Turn-by-turn Voice Navigation**: Heavy dependency on native device hardware and voice synthesis APIs.
- ❌ **Real-time Video CCTV Ingestion**: Excessive compute, bandwidth, and privacy compliance overhead.
- ❌ **Paid SMS / WhatsApp OTP**: Unnecessary financial overhead during academic/evaluator demo stages; covered completely via Nodemailer Ethereal/SMTP.

---

## 4. MVP Verification Acceptance Criteria

| Subsystem | Acceptance Criteria | Verified Method |
| :--- | :--- | :--- |
| **Frontend** | Renders without console errors on mobile (360px) and desktop (1920px). `npm run build` exits 0. | Verified via Vite build & Playwright/Subagent preview |
| **Backend** | All 31 tests pass with 0 failures (`npm test --prefix backend`). Express routes protected with JWT middleware. | Verified via `tsx --test` test suite |
| **Database** | Seamless connection to MongoDB; falls back gracefully to `memoryStore.ts` if offline without crashing. | Verified via unit tests & startup logs |
| **AI Engine** | Responds with valid `SafetyResult` within 200ms; falls back to internal algorithm if Python service is stopped. | Verified via `/api/safety/predict` tests |
