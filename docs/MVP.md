# 🛡️ SafeRoute MVP (Minimum Viable Product) – 10 to 12 Days Implementation Plan

> **Project Name**: SafeRoute – AI-Powered Safety-Aware Route Navigation  
> **Target Timeline**: 10 – 12 Working Days  
> **Objective**: Deliver a minimal, functional, secure, and production-ready MVP of the SafeRoute navigation platform.  
> **Scope Strategy**: Strict adherence to existing system architecture, zero application code bloat, and achievable daily sprint targets.  

---

## 📌 1. Project Requirements & Architecture Alignment

Based on the review of the SafeRoute codebase, specifications, and architecture:
* **Architecture**: Decoupled Monorepo (`frontend/`, `backend/`, `ai/`, `docs/`, `api/`, `.github/`).
* **Database Design**: MongoDB Mongoose schemas (`User`, `OTP`, `RefreshToken`) with in-memory resilient fallback.
* **API Gateway**: Node.js Express 5 with JWT RTR, Zod validation, Helmet, and rate limiting.
* **AI Service**: Python 3.12 FastAPI microservice serving a Scikit-Learn Random Forest model with a mathematical cloud fallback.
* **Frontend**: React 19 + TypeScript + Vite, featuring custom glassmorphism design tokens, Lucide icons, and GSAP canvas.
* **DevOps**: Docker, Docker Compose, GitHub Actions CI, and Vercel cloud deployment.

---

## 🎯 2. Feature Prioritization (MoSCoW Matrix)

| Priority Level | Features Included | Rationale / Objective |
| :--- | :--- | :--- |
| **Must-Have (P0)** | • User Sign Up, Login, and Logout<br>• 6-digit numeric OTP email verification<br>• JWT Access & Refresh Token Rotation (RTR)<br>• Multi-factor safety scoring (Lighting, Crime, Accident, Crowd)<br>• Interactive Route Safety Evaluator with 3 Presets & Sliders<br>• Role-Based Access Control (`USER` & `ADMIN`)<br>• Automated test suite & CI pipeline | Essential core value proposition; without these, the product cannot function as a safety navigation platform. |
| **Should-Have (P1)** | • Dedicated Admin Command Center (`/admin`)<br>• Real-time system telemetry (AI latency, user count)<br>• Mathematical cloud edge fallback if AI container is cold<br>• Vercel Web Analytics integration | Operational visibility, reliability, and analytics without adding heavy infrastructure dependencies. |
| **Could-Have (P2)** | • Visual radar chart for hazard breakdowns<br>• Safest vs. Fastest route comparison cards<br>• Auto-fill helper buttons for evaluator demos | High-value polish items for presentations and evaluator usability. |
| **Won't-Have (Out of MVP Scope)** | • Live police FIR automated web scraping<br>• Real-time CCTV camera video ingestion<br>• Turn-by-turn voice navigation<br>• SMS / WhatsApp paid OTP gateways | Excluded to ensure realistic delivery within the 10–12 day window. Deferred to Post-MVP (V2). |

---

## 👥 3. Team Roles & Responsibility Allocation

| Team Role | Key Responsibilities |
| :--- | :--- |
| **Frontend Developer (FE)** | React 19 UI, Vite configuration, CSS tokens, Auth modal, Route Evaluator sliders, Admin console UI. |
| **Backend Developer (BE)** | Express 5 gateway, MongoDB schemas, JWT RTR, authentication controllers, Zod validation, rate limiting. |
| **AI / ML Engineer (AI)** | FastAPI microservice, synthetic hazard dataset, Random Forest training, inference optimization, scoring formulas. |
| **DevOps & QA Engineer (QA)** | Dockerfiles, `docker-compose.yml`, GitHub Actions CI, unit/E2E test automation, bug tracking, and Vercel launch. |

---

## 🗓️ 4. 12-Day Day-by-Day Implementation Roadmap

```mermaid
gantt
    title SafeRoute 12-Day MVP Implementation Schedule
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation & APIs
    Day 1: Architecture, Monorepo & Schemas      :done, d1, 2026-10-11, 1d
    Day 2: Auth Engine, OTP & JWT RTR            :done, d2, 2026-10-12, 1d
    Day 3: Backend Gateway & Safety APIs         :done, d3, 2026-10-13, 1d
    section Phase 2: AI & UI Development
    Day 4: AI Microservice & Model Training      :done, d4, 2026-10-14, 1d
    Day 5: Frontend Design System & Shell        :done, d5, 2026-10-15, 1d
    Day 6: Interactive Route Evaluator UI        :done, d6, 2026-10-16, 1d
    Day 7: Auth Modal & Profile Management UI    :done, d7, 2026-10-17, 1d
    section Phase 3: Admin & Hardening
    Day 8: Admin Command Center Console          :done, d8, 2026-10-18, 1d
    Day 9: Security Hardening & Edge Fallbacks   :done, d9, 2026-10-19, 1d
    section Phase 4: QA, Bug Fixing & Launch
    Day 10: Automated Testing & Bug Fixing Buffer:done, d10, 2026-10-20, 1d
    Day 11: Containerization & GitHub Actions CI :done, d11, 2026-10-21, 1d
    Day 12: Production Cloud Launch & Final Demo :done, d12, 2026-10-22, 1d
```

---

### 🔹 Day 1: Architecture Setup, Monorepo & Database Schemas
* **Focus**: Foundation, Environment Setup & Data Models
* **Team Tasks**:
  - **FE**: Initialize Vite React 19 project, configure TypeScript paths, setup global CSS tokens.
  - **BE**: Initialize Express 5 monorepo workspace, setup `.env.example`, configure Mongoose database connection.
  - **AI**: Setup Python virtual environment (`.venv`), install FastAPI, Uvicorn, Scikit-Learn, and Joblib.
  - **QA**: Establish root Git repository, setup `.gitignore`, establish branch protection and commit conventions.
* **Core Deliverables**:
  - Mongoose models: `User.ts`, `OTP.ts`, `RefreshToken.ts`.
  - In-memory database fallback (`memoryStore.ts`) for zero-dependency local runs.
  - Health check endpoint (`/api/health`) returning `HTTP 200 OK`.

---

### 🔹 Day 2: Authentication Engine, 6-Digit OTP & JWT Token Rotation
* **Focus**: Identity, Verification & Session Security
* **Team Tasks**:
  - **FE**: Design initial login and registration form wireframes and state contracts.
  - **BE**: Implement `bcryptjs` password hashing, build cryptographically secure 6-digit OTP generator (`crypto.randomInt`), and integrate `nodemailer` transporter.
  - **AI**: Define multi-factor feature vector schema (Lighting, Crime Risk, Accident Probability, Crowd Density).
  - **QA**: Write initial API tests for user registration and OTP generation.
* **Core Deliverables**:
  - `POST /api/auth/register`, `POST /api/auth/verify-otp`, `POST /api/auth/login`, `POST /api/auth/logout`.
  - Short-lived Access Tokens (15 min) + `httpOnly` Refresh Tokens (7 days) with Refresh Token Rotation (RTR).

---

### 🔹 Day 3: Backend Gateway Routing & Core Safety Calculation
* **Focus**: Business Logic, Input Validation & Scoring Formula
* **Team Tasks**:
  - **FE**: Setup Axios API client service with automatic cookie forwarding and baseURL configurations.
  - **BE**: Build route evaluation endpoint `POST /api/safety/predict` with Zod input schema validation.
  - **AI**: Synthesize initial dataset (5,000 samples) mapping risk combinations to 0–100 safety indices.
  - **QA**: Test invalid input payloads (e.g., negative risk values, out-of-range ratings).
* **Core Deliverables**:
  - Mathematical baseline scoring engine:
    $$\text{RawScore} = (\text{Lighting} \times 3.5) + (\text{Crowd} \times 2.5) + ((10 - \text{Crime}) \times 2.5) + ((10 - \text{Accident}) \times 1.5)$$
  - Structured API response with score, classification badge (Optimal/Caution/Risk), and advisory text.

---

### 🔹 Day 4: AI Safety Scoring Microservice (FastAPI + Scikit-Learn)
* **Focus**: Machine Learning Model Training & Microservice Inference
* **Team Tasks**:
  - **FE**: Build prototype score meter component (0–100 circular gauge).
  - **BE**: Integrate Axios proxy forwarding from Express to FastAPI with a 3.5s timeout.
  - **AI**: Train **Random Forest Regressor** on synthetic multi-hazard scenarios, export weights to `safety_model.joblib`, and build `POST /predict` FastAPI endpoint.
  - **QA**: Benchmark AI inference latency (target: < 40ms per evaluation).
* **Core Deliverables**:
  - FastAPI server running on port 8000 with interactive Swagger UI at `/docs`.
  - High-speed machine learning inference endpoint returning prediction and model metadata.

---

### 🔹 Day 5: Frontend Design System & Glassmorphism UI Shell
* **Focus**: Visual Aesthetics, Layout & Navigation
* **Team Tasks**:
  - **FE**: Build dark-themed UI with glassmorphic cards, responsive header, user profile dropdown, and GSAP DotGrid canvas.
  - **BE**: Implement `GET /api/auth/me` to support client-side session hydration.
  - **AI**: Calibrate model output distribution to prevent extreme skewed scores on edge inputs.
  - **QA**: Verify layout rendering across viewports (375px mobile, 768px tablet, 1920px desktop).
* **Core Deliverables**:
  - Responsive landing page shell with interactive background, typography, and live session navigation.

---

### 🔹 Day 6: Interactive Route Safety Evaluator Interface
* **Focus**: User Experience, Sliders & Safety Presets
* **Team Tasks**:
  - **FE**: Build 3 quick safety preset buttons:
    - 🌙 *Night Walk (Strict)*: Lighting $\ge 90\%$, strict crime avoidance.
    - 🚗 *Daily Commute*: Balanced risk vs. travel efficiency.
    - 🛡️ *High Caution*: Maximum accident and crime avoidance.
  - **FE**: Build interactive range sliders for Lighting, Crime Risk, Accident Risk, and Crowd Level.
  - **BE**: Ensure CORS supports browser credentials and preflight OPTIONS requests.
  - **QA**: Test slider debounce handling and rapid state updates.
* **Core Deliverables**:
  - Complete Route Safety Evaluator with real-time score updates, comparison cards (Safest vs. Fastest), and latency badge.

---

### 🔹 Day 7: Authentication Modal & User Management UI
* **Focus**: Client Authentication Flow & Form Validation
* **Team Tasks**:
  - **FE**: Build `AuthModal.tsx` with Login, Register, and Forgot Password tabs; build 6-digit OTP input boxes with auto-focus.
  - **FE**: Implement real-time password strength meter (entropy, casing, length, symbols).
  - **BE**: Implement `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`.
  - **QA**: Perform complete user onboarding test: registration → email OTP → login → password reset.
* **Core Deliverables**:
  - Fully functional client authentication dialog with toast notifications and persistent auth state.

---

### 🔹 Day 8: Admin Command Center Console
* **Focus**: Governance, Telemetry & Role-Based Access Control
* **Team Tasks**:
  - **FE**: Build Admin Console modal and `/admin` direct route with statistics cards and user table.
  - **BE**: Implement `GET /api/admin/stats`, `GET /api/admin/users`, `PATCH /api/admin/users/:id/role`, and `DELETE /api/admin/users/:id`.
  - **BE**: Provision the administrator account from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the backend environment.
  - **QA**: Verify non-admin users receive `403 Forbidden` when attempting admin operations.
* **Core Deliverables**:
  - Admin Command Center at `/admin` featuring live telemetry, user role toggling, and an on-demand AI simulator.

---

### 🔹 Day 9: Security Hardening & Edge Failover Engine
* **Focus**: Cyber Hygiene, Abuse Prevention & Reliability
* **Team Tasks**:
  - **FE**: Add error boundaries and defensive error state views for network drops.
  - **BE**: Enforce `helmet` HTTP headers, configure `express-rate-limit` (15 auth attempts / 15 min), and sanitize inputs.
  - **AI / BE**: Implement the mathematical fallback inside `aiService.ts` so if the Python container is offline, evaluation never fails.
  - **QA**: Simulate AI service shutdown and verify route evaluations still return accurate scores without 502 errors.
* **Core Deliverables**:
  - Hardened API gateway and 100% resilient scoring engine with zero-downtime failover.

---

### 🔹 Day 10: Automated Testing & Bug Fixing Buffer
* **Focus**: Quality Assurance, Code Audit & Bug Remediation
* **Team Tasks**:
  - **FE**: Fix visual glitches, verify mobile menu behavior, ensure contrast accessibility.
  - **BE**: Audit token expiration handling and OTP retry limits.
  - **QA**: Write and execute comprehensive automated test suites:
    - `auth.test.ts`: 9 automated tests.
    - `admin.test.ts`: 8 automated tests.
    - `e2e.test.ts`: 11 automated tests.
  - **ALL**: Dedicate afternoon to addressing all uncovered edge-case bugs.
* **Core Deliverables**:
  - **28/28 automated tests passing (100% Green)** via `npm run test` with 0 failures.

---

### 🔹 Day 11: Containerization & GitHub Actions CI Pipeline
* **Focus**: DevOps, Reproducibility & Continuous Integration
* **Team Tasks**:
  - **QA / BE**: Create production Dockerfiles (`frontend/Dockerfile`, `backend/Dockerfile`, `ai/Dockerfile`).
  - **QA**: Build root `docker-compose.yml` orchestrating all tiers with a single `docker-compose up` command.
  - **QA**: Configure `.github/workflows/ci.yml` running tests, typechecks, and linting on every push.
  - **FE**: Verify production bundle build (`npm run build`) runs cleanly without warnings.
* **Core Deliverables**:
  - Reproducible containerized setup and GitHub Actions CI passing with 100% Green status on `main`.

---

### 🔹 Day 12: Production Cloud Deployment & Final Showcase
* **Focus**: Cloud Hosting, Presentation Artifacts & Submission
* **Team Tasks**:
  - **FE / QA**: Configure `vercel.json` for multi-service deployment, deploy to Vercel, and integrate `@vercel/analytics`.
  - **BE**: Set up production environment variables and verify CORS on production domains.
  - **ALL**: Finalize submission documentation:
    - [PRESENTATION_SLIDES.md](file:///c:/Users/shraw/OneDrive/Desktop/SafeRoute/docs/PRESENTATION_SLIDES.md) (10-slide PowerPoint slide deck).
    - [DEMO_WALKTHROUGH.md](file:///c:/Users/shraw/OneDrive/Desktop/SafeRoute/docs/DEMO_WALKTHROUGH.md) (3-minute evaluator presentation script).
    - [FINAL_SUBMISSION_CHECKLIST.md](file:///c:/Users/shraw/OneDrive/Desktop/SafeRoute/docs/FINAL_SUBMISSION_CHECKLIST.md) (15-item submission verification checklist).
* **Core Deliverables**:
  - Live production URL, complete slide deck, video/live demo walkthrough script, and ready project submission.

---

## 🎯 5. Definition of Done (DoD)

A daily sprint task is considered **Complete** only when:
1. **Zero Runtime Exceptions**: Feature functions without unhandled console or server errors.
2. **Type Safety**: TypeScript compiles cleanly with zero compilation errors (`tsc -b`).
3. **Automated Verification**: Associated unit or integration tests pass (`npm run test`).
4. **Security Checked**: Input schemas validated with Zod; authenticated endpoints protected by JWT middleware.
5. **Responsive**: Layout audited on both mobile (375px) and desktop (1920px) screens.
6. **Git Committed**: Changes committed with descriptive commit messages and pushed to the repository.

---

## 🚀 6. Verification Commands

```bash
# Run complete test suite (28 tests across auth, admin, and e2e)
npm run test

# Verify production builds for frontend and backend
npm run build

# Start all development daemons locally
npm run dev

# Spin up full-stack environment in Docker
docker-compose up --build
```
