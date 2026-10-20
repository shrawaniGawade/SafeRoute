# 📋 SafeRoute System Requirements Specification

> **Project Title**: SafeRoute — AI-Powered Safety-Aware Route Recommendation System  
> **Document Version**: 1.0.0  
> **Status**: Approved Architecture Blueprint  
> **Target Audience**: Developers, Architects, QA Engineers, and Stakeholders  

---

## 1. Problem Statement

Conventional navigation platforms (such as Google Maps or Apple Maps) optimize journeys predominantly for **speed**, **distance**, and **traffic density**. However, they possess a critical blind spot: they do not factor in personal safety. 

Consequently, pedestrians, women, students, and night travelers are frequently routed through deserted alleys, poorly illuminated streets, or historically high-crime corridors merely to save a few minutes. 

**SafeRoute** solves this safety imbalance by evaluating dynamic environmental and risk variables—including street lighting, crime records, crowd density, and accident frequency—to compute a predictive, multi-factor **Safety Score (0–100)** and recommend routes where safety takes precedence over speed.

---

## 2. Target Stakeholders & User Roles

### 2.1 Target Users (Commuters & Travelers)
- **Night Travelers & Shift Workers:** Individuals traveling late at night who prioritize well-lit, active thoroughfares over shortcuts.
- **Students & Campus Commuters:** Young adults walking or cycling through urban or suburban neighborhoods.
- **Tourists & New Residents:** Commuters unfamiliar with local crime patterns or accident-prone corridors.
- **Everyday Pedestrians:** Citizens seeking low-risk routes with continuous crowd presence and police visibility.

### 2.2 Administrator Role
- **City & Safety Administrators:** Superusers who monitor platform telemetry, microservice health (Express gateway and Python FastAPI AI engine), and system uptime.
- **User Management Operations:** Authorities capable of reviewing registered users, promoting trusted users to administrators, demoting accounts, or deleting malicious profiles.
- **Model Validation:** Administrators who run real-time inference probe tests against the AI prediction engine to ensure model accuracy and track inference latency.

---

## 3. Functional Requirements (FR)

### Module 1: Authentication & Identity Management
| ID | Requirement Description | Status in Codebase |
| :--- | :--- | :--- |
| **FR-AUTH-01** | User registration with Full Name, Email, and strong Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char). | ✅ **Implemented** |
| **FR-AUTH-02** | 6-digit numeric OTP generation with SHA-256 database hashing and 10-minute expiration TTL. | ✅ **Implemented** |
| **FR-AUTH-03** | Automated OTP email dispatch via Nodemailer (Ethereal test inbox in dev; SMTP in production). | ✅ **Implemented** |
| **FR-AUTH-04** | User login verifying email and hashed password with bcryptjs (12 salt rounds). | ✅ **Implemented** |
| **FR-AUTH-05** | Refresh Token Rotation (RTR) storing tokens in HttpOnly, SameSite cookies with reuse/theft detection. | ✅ **Implemented** |
| **FR-AUTH-06** | Short-lived Access Tokens (15-minute lifespan) stored strictly in client memory. | ✅ **Implemented** |
| **FR-AUTH-07** | Forgot password and reset password workflow utilizing verified OTP handover. | ✅ **Implemented** |
| **FR-AUTH-08** | OAuth2 Social Login (Sign in with Google / GitHub). | ⏳ *Proposed (V2)* |

### Module 2: Safety Route Evaluation & AI Scoring
| ID | Requirement Description | Status in Codebase |
| :--- | :--- | :--- |
| **FR-EVAL-01** | Input origin and destination locations for safety evaluation. | ✅ **Implemented** |
| **FR-EVAL-02** | Multi-factor safety analysis based on 4 core environmental factors (Lighting, Crime Risk, Accident Probability, Crowd Level). | ✅ **Implemented** |
| **FR-EVAL-03** | Dynamic AI calculation producing a 0–100 Composite Safety Score with safety classification (Safe, Caution, Danger). | ✅ **Implemented** |
| **FR-EVAL-04** | Interactive slider controls allowing users to adjust safety factor weightings (1–10 scale). | ✅ **Implemented** |
| **FR-EVAL-05** | Pre-configured safety profiles (*Night Traveler Corridors*, *Fast & Safe*, *Maximum Crowd*, *Custom*). | ✅ **Implemented** |
| **FR-EVAL-06** | Real-time map rendering with multi-polyline display (comparing Safest Route vs. Fastest Route). | ⏳ *Proposed (V1.5 - Leaflet / Mapbox)* |
| **FR-EVAL-07** | Automated turn-by-turn routing coordinates with OpenStreetMap / Mapbox Directions API. | ⏳ *Proposed (V1.5)* |

### Module 3: Admin Command Center & Telemetry
| ID | Requirement Description | Status in Codebase |
| :--- | :--- | :--- |
| **FR-ADM-01** | Role-Based Access Control (RBAC) restricting `/api/admin/*` endpoints strictly to users with `role: 'admin'`. | ✅ **Implemented** |
| **FR-ADM-02** | System telemetry dashboard reporting Express API memory usage, server uptime, and active connection count. | ✅ **Implemented** |
| **FR-ADM-03** | User management console allowing admin to view users, promote standard users to admin, demote, and delete users. | ✅ **Implemented** |
| **FR-ADM-04** | Interactive AI model probe allowing admins to test inference directly from the browser and inspect execution latency in milliseconds. | ✅ **Implemented** |
| **FR-ADM-05** | Seamless navigation switch allowing admins to toggle between Admin Dashboard (`#/admin`) and Traveler Route Planner (`#/app`). | ✅ **Implemented** |
| **FR-ADM-06** | Audit logging recording administrative actions (role changes, deletions). | ⏳ *Proposed (V2)* |

### Module 4: Navigation & Public Experience
| ID | Requirement Description | Status in Codebase |
| :--- | :--- | :--- |
| **FR-PUB-01** | Dedicated full-page Login & Registration portal (`#/login`) serving as default unauthenticated entry point. | ✅ **Implemented** |
| **FR-PUB-02** | Public Overview Landing Page (`#/landing`) showcasing hero banner, interactive dot grid, 4-factor scoring, and workflow. | ✅ **Implemented** |
| **FR-PUB-03** | Route guards redirecting unauthenticated visitors attempting to access `#/app` or `#/admin` back to `#/login`. | ✅ **Implemented** |
| **FR-PUB-04** | One-click demo credentials autofill for quick testing. | ✅ **Implemented** |

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Security & Protection (NFR-SEC)
- **NFR-SEC-01 (Password Encryption):** Passwords must be hashed using `bcryptjs` with a work factor of 12 salt rounds before database persistence.
- **NFR-SEC-02 (Token Hardening):** Refresh tokens must be stored in HTTP-only, Secure (production), SameSite cookies to protect against Cross-Site Scripting (XSS).
- **NFR-SEC-03 (Token Rotation):** Every refresh token exchange must issue a new refresh token and invalidate the former (RTR). Replaying a revoked token immediately invalidates all active sessions for that user family.
- **NFR-SEC-04 (Input Sanitization):** All backend inputs must be strictly validated using Zod schemas to eliminate injection vectors and malformed payloads.
- **NFR-SEC-05 (HTTP Security Headers):** All HTTP responses must include security headers via Helmet (CSP, HSTS, frameguard).
- **NFR-SEC-06 (Rate Limiting):** Authentication endpoints (`/api/auth/*`) must be throttled via IP rate limiters to prevent brute-force attacks.

### 4.2 Performance & Responsiveness (NFR-PERF)
- **NFR-PERF-01 (Inference Latency):** The AI scoring microservice must return inference results within **150ms** under normal server load.
- **NFR-PERF-02 (API Gateway Throughput):** Express API gateway endpoints must complete execution within **80ms** (excluding cold-start network latencies).
- **NFR-PERF-03 (Frontend Load Time):** Vite-bundled production assets must achieve First Contentful Paint (FCP) in under **1.2s** on broadband connections.
- **NFR-PERF-04 (Mobile Responsiveness):** The application must be fully responsive across viewport widths from **360px** (smartphones) up to **1920px+** (large monitors) with zero horizontal overflow.

### 4.3 Reliability & Availability (NFR-REL)
- **NFR-REL-01 (Graceful Degradation):** If the Python FastAPI microservice is offline or unreachable, the Express backend must fall back to an internal heuristic safety scorer without failing the client request.
- **NFR-REL-02 (Database Fallback):** If MongoDB is temporarily unreachable during development or unit testing, the backend must operate via an in-memory mock store (`memoryStore.ts`) to ensure service continuity.

### 4.4 Maintainability & Extensibility (NFR-MAINT)
- **NFR-MAINT-01 (TypeScript Rigor):** Frontend and backend codebases must maintain 100% strict TypeScript typing with zero unresolved `tsc` build errors.
- **NFR-MAINT-02 (Cross-Platform CI):** Monorepo CI workflow must execute cleanly on both Linux runners (GitHub Actions Ubuntu) and Windows local developer environments.
