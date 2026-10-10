# 🛡️ SafeRoute MVP (Minimum Viable Product) – 10 to 12 Days Execution Plan

> **Project**: SafeRoute – AI-Powered Safety-Aware Route Navigation  
> **Timeline**: 10 to 12 Working Days  
> **Goal**: Deliver a fully functional, production-ready, and deployable Minimum Viable Product (MVP) of SafeRoute within a 10 to 12-day sprint.  
> **Status**: Ready & Executable 🚀  

---

## 📌 1. Executive Summary & MVP Scope Definition

SafeRoute is an intelligent navigation and route-planning platform designed to prioritize personal safety. Instead of calculating routes based purely on distance or travel time, SafeRoute evaluates journeys using multi-dimensional safety parameters: **Street Lighting Quality**, **Historical Crime Risk**, **Accident Probability**, and **Crowd Density**.

### 🎯 Core MVP Features ("Must-Haves"):
1. **User Authentication & RBAC**: Secure email registration, 6-digit numeric OTP verification via email, JWT Access/Refresh tokens with Refresh Token Rotation (RTR), and User/Admin role separation.
2. **AI-Powered Route Safety Engine**: Python FastAPI microservice serving a Random Forest inference model (0–100 safety score) with a resilient mathematical cloud edge fallback.
3. **Interactive Route Safety Evaluator UI**: Live parameter tuning sliders and 3 quick presets (*Night Walk, Daily Commute, High Caution*).
4. **Visual Risk Breakdown & Metric Cards**: Radial score breakdown, Safest vs. Fastest route side-by-side comparison, and contextual safety advisories.
5. **Admin Command Center Console**: Real-time system telemetry (AI latency, registered users, active evaluations), user directory management (role promotion/demotion), and a live AI simulator.
6. **Enterprise Security & Reliability**: Security HTTP headers via `helmet`, endpoint rate limiting via `express-rate-limit`, input schema validation via `zod`, and secure password hashing via `bcryptjs`.
7. **Production DevOps & CI/CD**: Containerized Docker setup, automated GitHub Actions CI pipeline (100% Green), and Vercel cloud deployment.

---

## 🗓️ 12-Day Sprint Schedule Breakdown

```mermaid
gantt
    title SafeRoute 12-Day MVP Sprint Schedule
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation & APIs
    Day 1: Monorepo, Database & Architecture   :done, d1, 2026-10-11, 1d
    Day 2: Authentication & 6-Digit OTP Engine :done, d2, 2026-10-12, 1d
    Day 3: Backend Gateway & Safety APIs       :done, d3, 2026-10-13, 1d
    section Phase 2: AI & Interactive UI
    Day 4: AI FastAPI Scoring Microservice     :done, d4, 2026-10-14, 1d
    Day 5: Frontend Design System & Theme Shell:done, d5, 2026-10-15, 1d
    Day 6: Interactive Route Evaluator UI      :done, d6, 2026-10-16, 1d
    Day 7: Auth Modal & User Profile UI        :done, d7, 2026-10-17, 1d
    section Phase 3: Administration & Security
    Day 8: Admin Command Center Console        :done, d8, 2026-10-18, 1d
    Day 9: Security Hardening & Failover Engine:done, d9, 2026-10-19, 1d
    section Phase 4: Testing & Deployment
    Day 10: Automated Unit & E2E Test Suite    :done, d10, 2026-10-20, 1d
    Day 11: Docker & GitHub Actions CI Pipeline:done, d11, 2026-10-21, 1d
    Day 12: Cloud Launch, Presentation & Demo  :done, d12, 2026-10-22, 1d
```

---

## 📅 Day-by-Day Implementation Roadmap

---

### 🔹 Day 1: Architecture Setup, Monorepo & Database Schemas
* **Objective**: Establish the core monorepo structure, development environment, and database persistence schemas.
* **Key Tasks**:
  - [x] Configure monorepo structure: `frontend/`, `backend/`, `ai/`, `docs/`, `api/`, and `.github/`.
  - [x] Set up TypeScript configuration (`tsconfig.json`), root package management, and `.env.example` templates.
  - [x] Design and implement MongoDB Mongoose schemas:
    - `User`: name, email, passwordHash, role (`USER` | `ADMIN`), isVerified, createdAt.
    - `OTP`: email, otpHash, type (`EMAIL_VERIFICATION` | `PASSWORD_RESET`), TTL expiration index (10 minutes).
    - `RefreshToken`: userId, tokenHash, familyId, isRevoked, expiresAt.
  - [x] Implement in-memory database fallback to ensure seamless local execution when MongoDB is offline.
* **Deliverable**: Backend server runs cleanly on port 5000 and responds with `HTTP 200 OK` on `/api/health`.

---

### 🔹 Day 2: Authentication Engine & 6-Digit OTP Email Verification
* **Objective**: Build an enterprise-grade authentication suite with cryptographic OTP verification and token management.
* **Key Tasks**:
  - [x] Implement password hashing with `bcryptjs` (salt rounds: 10+).
  - [x] Build cryptographically secure 6-digit numeric OTP generator using `crypto.randomInt`.
  - [x] Configure `nodemailer` email transporter with automatic Ethereal test inbox generation for instant preview.
  - [x] Create registration and OTP verification endpoints:
    - `POST /api/auth/register`
    - `POST /api/auth/verify-otp`
    - `POST /api/auth/login`
    - `POST /api/auth/logout`
  - [x] Implement short-lived Access Tokens (15 min) and `httpOnly` Refresh Tokens (7 days) with Refresh Token Rotation (RTR).
* **Deliverable**: End-to-end user registration, email OTP verification, and authenticated session issuance verified via API tests.

---

### 🔹 Day 3: Backend Gateway Routing & Core Safety Calculation
* **Objective**: Build the route safety evaluation gateway endpoints and business logic.
* **Key Tasks**:
  - [x] Implement `POST /api/safety/predict` endpoint.
  - [x] Build Zod validation schemas for incoming parameter payloads: `lighting`, `crime_risk`, `accident_risk`, `crowd_level` (ranges 0–10).
  - [x] Implement resilient mathematical scoring formula:
    $$\text{RawScore} = (\text{Lighting} \times 3.5) + (\text{Crowd} \times 2.5) + ((10 - \text{Crime}) \times 2.5) + ((10 - \text{Accident}) \times 1.5)$$
  - [x] Implement safety classification badges: `Optimal (80–100)`, `Moderate Caution (55–79)`, and `High Risk (<55)`.
* **Deliverable**: Gateway returns structured safety scores, factor breakdowns, and safety advisories in < 15ms.

---

### 🔹 Day 4: AI Safety Scoring Microservice (FastAPI + Scikit-Learn)
* **Objective**: Build and serve a machine learning model predicting route safety index.
* **Key Tasks**:
  - [x] Set up Python 3.12 virtual environment and FastAPI service on port 8000.
  - [x] Synthesize realistic multi-hazard dataset and train a **Random Forest Regressor**.
  - [x] Persist model weights via `joblib` (`safety_model.joblib`) and load on startup.
  - [x] Expose high-speed inference endpoint: `POST /predict`.
  - [x] Connect Node.js backend proxy with automatic timeout handling and instant mathematical fallback.
* **Deliverable**: FastAPI service running with interactive Swagger documentation at `http://127.0.0.1:8000/docs`.

---

### 🔹 Day 5: Frontend Design System & Glassmorphism UI Shell
* **Objective**: Build a modern, premium dark-themed user interface with interactive visual components.
* **Key Tasks**:
  - [x] Set up React 19 + TypeScript + Vite with custom modern CSS design tokens.
  - [x] Build interactive animated background layer using GSAP-driven DotGrid canvas.
  - [x] Create navigation bar with live session state, user dropdown menu, and Admin badge indicators.
  - [x] Build responsive layout supporting mobile screens (375px+), tablets, and high-resolution desktops.
* **Deliverable**: Landing page renders smoothly in the browser with dark theme, glassmorphic cards, and dynamic navigation.

---

### 🔹 Day 6: Interactive Route Safety Evaluator Interface
* **Objective**: Build the interactive evaluator allowing users to customize risk factors and view comparisons.
* **Key Tasks**:
  - [x] Implement 3 quick safety presets:
    - 🌙 **Night Walk (Strict)**: Prioritizes 90%+ lighting and strict crime avoidance.
    - 🚗 **Daily Commute**: Balanced travel time and safety.
    - 🛡️ **High Caution**: Maximum accident and crime avoidance.
  - [x] Build interactive parameter sliders: Lighting, Crime Avoidance, Accident Risk, Crowd Density.
  - [x] Build circular/linear safety score meter (0–100) with dynamic color transitions (Green / Amber / Red).
  - [x] Display Safest Route vs. Fastest Route comparison cards and AI latency badge.
* **Deliverable**: Real-time slider adjustments update scores, factors, and recommendations instantaneously.

---

### 🔹 Day 7: Authentication Modal & User Management UI
* **Objective**: Build client-side authentication modal and global user state management.
* **Key Tasks**:
  - [x] Build glassmorphic `AuthModal` component supporting Login, Registration, and Password Reset tabs.
  - [x] Build 6-digit OTP input boxes with auto-focus and backspace keyboard navigation.
  - [x] Implement real-time password strength meter (evaluating entropy, length, casing, and symbols).
  - [x] Build `AuthContext` provider handling session persistence, token refreshes, and toast notifications.
* **Deliverable**: Complete browser-based user onboarding flow: register, verify OTP, log in, and view profile.

---

### 🔹 Day 8: Admin Command Center Console
* **Objective**: Deliver a full administrative control panel for system telemetry and user governance.
* **Key Tasks**:
  - [x] Build Role-Based Route Guard (`/admin` and `#admin`) restricted exclusively to users with `role: 'ADMIN'`.
  - [x] Build Real-Time System Telemetry: AI Inference Latency, Registered Users, Route Evaluation Count, Cache Hit Rate.
  - [x] Build User Directory: View registered accounts, toggle roles (`USER` ⇄ `ADMIN`), and delete accounts.
  - [x] Build Live AI Route Simulator: Execute on-demand model predictions directly inside the console.
  - [x] Seed default administrator credentials (`admin@saferoute.com` / `Admin@12345`) with helper auto-fill button.
* **Deliverable**: Fully functional Admin Command Center accessible at `http://localhost:5173/admin`.

---

### 🔹 Day 9: Security Hardening & Failover Reliability
* **Objective**: Fortify the system against web vulnerabilities and verify microservice failover behaviors.
* **Key Tasks**:
  - [x] Enforce secure HTTP headers using `helmet`.
  - [x] Implement brute-force protection with `express-rate-limit` (15 auth requests / 15-minute window).
  - [x] Configure CORS policy supporting secure credentials (cookies).
  - [x] Validate microservice failover: verify that if Python FastAPI is offline, backend serves mathematical fallback seamlessly with zero 502 errors.
* **Deliverable**: System defends against brute-force attacks and gracefully handles offline microservices.

---

### 🔹 Day 10: Automated Test Suite (Unit, Admin & E2E Tests)
* **Objective**: Build and execute comprehensive automated tests covering all critical paths.
* **Key Tasks**:
  - [x] Authentication test suite (`auth.test.ts`): registration, OTP verification, login, password reset (9 tests).
  - [x] Admin authorization test suite (`admin.test.ts`): role guards, telemetry retrieval, user management (8 tests).
  - [x] End-to-end integration test suite (`e2e.test.ts`): cryptographic helpers, password validation, full lifecycle (11 tests).
  - [x] Verify **100% Green passing rate (28/28 tests passing)**:
    ```bash
    npm run test
    ```
* **Deliverable**: Complete test suite runs and passes with 0 failures in under 12 seconds.

---

### 🔹 Day 11: Docker Containerization & GitHub Actions CI Pipeline
* **Objective**: Containerize all services and establish automated Continuous Integration.
* **Key Tasks**:
  - [x] Author production Dockerfiles:
    - `frontend/Dockerfile` (Node 20 + Nginx)
    - `backend/Dockerfile` (Node 20 Alpine)
    - `ai/Dockerfile` (Python 3.12 Slim)
  - [x] Create root `docker-compose.yml` to orchestrate all services with one command: `docker-compose up`.
  - [x] Create GitHub Actions workflow (`.github/workflows/ci.yml`):
    - Run backend automated test suite on Ubuntu runner.
    - Run frontend TypeScript typecheck and Vite production build.
    - Run Python AI linting.
* **Deliverable**: GitHub repository displays **100% Green checkmark** on every commit to `main`.

---

### 🔹 Day 12: Production Cloud Deployment & Final Submission Showcase
* **Objective**: Deploy the full-stack app to the cloud and prepare presentation deliverables.
* **Key Tasks**:
  - [x] Configure Vercel multi-service deployment (`vercel.json`) with serverless API bridge (`api/index.ts`).
  - [x] Integrate Vercel Web Analytics (`@vercel/analytics`).
  - [x] Author comprehensive project presentation materials:
    - [PRESENTATION_SLIDES.md](file:///c:/Users/shraw/OneDrive/Desktop/SafeRoute/docs/PRESENTATION_SLIDES.md): 10-slide technical defense slide deck.
    - [DEMO_WALKTHROUGH.md](file:///c:/Users/shraw/OneDrive/Desktop/SafeRoute/docs/DEMO_WALKTHROUGH.md): 3-minute live evaluator demonstration script.
    - [FINAL_SUBMISSION_CHECKLIST.md](file:///c:/Users/shraw/OneDrive/Desktop/SafeRoute/docs/FINAL_SUBMISSION_CHECKLIST.md): 15-item milestone audit checklist.
* **Deliverable**: Live production cloud application, presentation slide deck, and comprehensive documentation ready for evaluators.

---

## 📊 Feature Comparison Matrix (12-Day MVP vs. Future V2)

| Feature | 12-Day MVP Scope | Future Version (V2 Roadmap) |
| :--- | :---: | :---: |
| **User Sign Up & Login** | ✅ Included (JWT + RTR) | Social OAuth (Google, Apple ID) |
| **6-Digit OTP Email Verification** | ✅ Included (Nodemailer) | SMS / WhatsApp OTP (Twilio) |
| **Multi-Parameter Route Scoring** | ✅ Included (4 Core Hazards) | Live CCTV Camera Video Ingestion |
| **Interactive Route Evaluator UI** | ✅ Included (3 Presets + Sliders) | Turn-by-Turn Spoken Voice Navigation |
| **AI Random Forest Safety Predictor** | ✅ Included (<40ms Inference) | Automated Police Incident Web Scraping |
| **Admin Command Center** | ✅ Included (Live Telemetry & Users) | Dynamic City Crime Heatmap Generator |
| **Cloud Resilient Fallback** | ✅ Included (100% Uptime Guaranteed) | Multi-Region Active-Active Cloud Mesh |
| **Automated CI/CD & Docker** | ✅ Included (GitHub Actions + Compose) | Kubernetes Auto-Scaling Cluster |

---

## 💻 Tech Stack Architecture

| Layer | Technologies Used | Primary Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Vanilla CSS, GSAP | Interactive UI, safety sliders, animations, auth modal |
| **Backend Gateway** | Node.js, Express 5, TypeScript, Zod, JWT, Helmet | API routing, input validation, token rotation, admin guards |
| **AI Scoring Engine** | Python 3.12, FastAPI, Scikit-Learn, Joblib, Uvicorn | Multi-factor route safety inference model (<40ms) |
| **Database** | MongoDB (Mongoose) + Memory Store Fallback | User accounts, OTP codes, refresh token families |
| **DevOps & Cloud** | Docker, Docker Compose, GitHub Actions, Vercel | Monorepo containerization, CI test pipeline, cloud hosting |

```
┌────────────────────────────────────────────────────────┐
│             Frontend: React 19 + TypeScript            │
│       Vite • GSAP Canvas • Lucide Icons • Vanilla CSS  │
└───────────────────────────┬────────────────────────────┘
                            │ (JSON REST / Cookies)
                            ▼
┌────────────────────────────────────────────────────────┐
│         Backend Gateway: Node.js + Express 5           │
│     TypeScript • Zod • Bcrypt • JWT (RTR) • Helmet     │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Database: MongoDB      │  │  AI Service: Python 3.12 │
│ Mongoose • TTL Indexes   │  │ FastAPI • Scikit-Learn   │
│ Users • OTPs • Tokens    │  │ Random Forest Predictor  │
└──────────────────────────┘  └──────────────────────────┘
```

---

## 🎯 Definition of Done (DoD)

A milestone is considered **Done** only when:
1. **Zero Runtime Errors**: Application executes without unhandled exceptions or crashes.
2. **Type Safety**: TypeScript compiles cleanly with zero type errors (`npm run build`).
3. **100% Tests Pass**: All 28 automated unit, admin, and integration tests pass cleanly (`npm run test`).
4. **Mobile Responsive**: Verified across mobile (375px+), tablet, and desktop viewports.
5. **Git Synced**: Code committed with clear commit messages and pushed to the remote repository.

---

## 🚀 Quick Command Reference

```bash
# 1. Run the entire automated test suite (28 tests)
npm run test

# 2. Build both frontend and backend for production
npm run build

# 3. Start development servers locally
npm run dev

# 4. Spin up the entire stack using Docker Compose
docker-compose up --build
```
