# 📅 SafeRoute Prioritized Implementation Plan & Technical Roadmap

> **Document Version**: 1.0.0  
> **Status**: Comprehensive Engineering Phasing Plan  
> **Target Execution**: Structured Phase-by-Phase Roadmap  

---

## 1. Overview & Guiding Principles

This implementation plan establishes the exact sequence of engineering work required to transition SafeRoute from the current working MVP baseline to a full-featured, database-connected, interactive mapping production release.

### Rules of Engagement:
1. **Never break working functionality**: The existing authentication engine, route predictor, role controllers, and responsive layout must remain operational across all phases.
2. **Verify at every stage**: Each completed milestone must be validated via automated tests (`npm test`) and frontend production builds (`npm run build`).
3. **Graceful degradation**: All integrations with third-party services (MongoDB, Mapbox/Leaflet, external AI models) must include offline or mock fallbacks.

---

## 2. Current Project Status Summary

| Subsystem | Current State | Verification Status |
| :--- | :--- | :--- |
| **Authentication & RBAC** | Complete (Login, Register, OTP verification, Password Reset, RTR) | ✅ 31/31 Tests Passing |
| **Frontend UI Screens** | Complete (Login Portal, Public Overview, Traveler Planner, Admin Console) | ✅ Responsive & Verified |
| **AI Scoring Engine** | Complete (FastAPI microservice + Scikit-Learn Random Forest + Fallback) | ✅ Online & Integrated |
| **Database Integration** | Configured with Mongoose + Transparent `memoryStore.ts` Fallback | ✅ Operational |
| **Admin Controls** | Complete (Telemetry, live AI inference probe, user role management) | ✅ Operational |
| **CI / CD Pipeline** | Complete (GitHub Actions Linux runner with native Rolldown bindings) | ✅ Passing |

---

## 3. Exact Implementation Order for Missing Features

The missing features are prioritized into three sequential phases based on user value and architectural dependencies:

```
[Phase 1: Database Hardening & User Persistence]
                       ↓
[Phase 2: Interactive Map & Geospatial Routing Integration]
                       ↓
[Phase 3: Community Hazard Reporting & Production Hardening]
```

---

### Phase 1: Database Hardening & Route History Persistence (Priority: High)
*Objective: Enable logged-in commuters to save, bookmark, and review their evaluated routes.*

- **Step 1.1: Create `SavedRoute` Mongoose Model & Schema (`backend/src/models/SavedRoute.ts`)**
  - Fields: `userId`, `origin`, `destination`, `safetyScore`, `riskLevel`, `factorWeights`, `timestamps`.
  - Add proxy in-memory fallback to `memoryStore.ts` for non-database test runs.
- **Step 1.2: Implement Route Storage Endpoints (`backend/src/routes/routeRoutes.ts`)**
  - `POST /api/routes/save`: Save an evaluated route to user profile (Protected by `requireAuth`).
  - `GET /api/routes/saved`: Fetch user's saved route history with pagination.
  - `DELETE /api/routes/saved/:id`: Remove a saved route.
- **Step 1.3: Update UserDashboard Frontend (`frontend/src/components/UserDashboard.tsx`)**
  - Add "Save Route to Favorites" button in the AI Safety Result card.
  - Add "Recent & Saved Journeys" accordion panel below the evaluation card.
- **Step 1.4: Validation & Testing**
  - Add unit and integration tests covering the saved route endpoints in `backend/src/tests/routes.test.ts`.

---

### Phase 2: Interactive Map & Geospatial Visualization (Priority: High)
*Objective: Replace static textual origin/destination with visual map routing and polyline rendering.*

- **Step 2.1: Select Mapping Library**
  - Recommended: **Leaflet.js + OpenStreetMap (via `react-leaflet`)** — zero cost, no mandatory credit card or paid API key required for evaluation.
  - Alternative: **Mapbox GL JS** (if commercial vector styling is needed).
- **Step 2.2: Add Leaflet Dependency & Component (`frontend/src/components/RouteMap.tsx`)**
  - Interactive map canvas with customizable dark/light tile layers.
  - Start/End point draggable pins.
  - Multi-colored polylines indicating route segments (Green = High Safety, Yellow = Moderate, Red = Caution).
- **Step 2.3: Address Autocomplete & Geocoding Integration**
  - Connect OpenStreetMap Nominatim API for search suggestions as users type in source/destination inputs.
- **Step 2.4: Safest vs. Fastest Polyline Comparison**
  - Render dual routes simultaneously on the map canvas:
    - Route A (Green): Evaluated SafeRoute prioritizing lighting & crowd.
    - Route B (Dashed Orange): Traditional fastest route.

---

### Phase 3: Community Hazard Reporting & Advanced Hardening (Priority: Medium)
*Objective: Crowdsourced safety intelligence and production auditability.*

- **Step 3.1: Create `HazardReport` Mongoose Model (`backend/src/models/HazardReport.ts`)**
  - Fields: `reporterId`, `hazardType` (Poor Lighting, Suspicious Crowd, Accident Hazard, Roadblock), `coordinates`, `severity` (1–5), `verifiedByAdmin`, `expiresAt`.
- **Step 3.2: Hazard Reporting Endpoints**
  - `POST /api/hazards`: Submit an active hazard report.
  - `GET /api/hazards/nearby`: Retrieve active hazards within a bounding box / radius.
- **Step 3.3: Admin Moderation View**
  - Add a "Hazard Reports" tab in `AdminDashboard.tsx` to approve or dismiss community reports.
- **Step 3.4: Production Docker & Cloud Deployment**
  - Verify `docker-compose.yml` orchestrating MongoDB, Express, FastAPI, and Nginx.

---

## 4. Technical Risk Analysis & Mitigation Matrix

| Risk ID | Identified Risk | Impact | Probability | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | Python AI microservice cold-start or container crash | High | Medium | Express API implements a mathematical baseline fallback in `aiService.ts` returning computed scores if port 8000 is unreachable. |
| **RSK-02** | MongoDB connection outage in production or testing | High | Low | Mongoose Proxy pattern seamlessly routes reads/writes to `memoryStore.ts`, keeping user flows functional. |
| **RSK-03** | Third-party geocoding API rate limits (Nominatim / Mapbox) | Medium | Medium | Implement client-side debounce (400ms) on search inputs and cache frequent geocode lookups in Express. |
| **RSK-04** | Email delivery limits or SMTP downtime | Low | Low | Ethereal mailer generates instant web previews locally; production utilizes retry queues with exponential backoff. |

---

## 5. External API Keys & Services Required

| Service | Purpose | Phase Needed | Free Tier / Availability |
| :--- | :--- | :--- | :--- |
| **OpenStreetMap / Leaflet** | Map tile rendering | Phase 2 | Free (No API key required) |
| **OSM Nominatim** | Address autocomplete | Phase 2 | Free (Rate limit: 1 req/sec) |
| **Mapbox (Optional)** | Vector tiles & directions | Phase 2 (Optional) | Free tier: 50,000 monthly map loads |
| **Ethereal Email** | Development email test preview | Existing (MVP) | 100% Free / Auto-generated accounts |
| **SendGrid / AWS SES** | Production email dispatch | Phase 3 | Free tier available |
| **MongoDB Atlas** | Managed cloud database | Existing / Phase 1 | Free tier (M0 Sandbox: 512MB) |
