# SafeRoute 🛡️ - Final Presentation Slides Deck

> **Smarter Journeys. Safer Choices.**  
> *Project Presentation & Technical Defense*

---

## 📽️ Slide 1: Title & Overview
- **Project Name**: SafeRoute
- **Tagline**: AI-Powered Safety-Aware Route Navigation & Security Management
- **Presenter**: Shrawani Gawade & Team
- **Key Modules**:
  - React 19 + TypeScript + GSAP Dynamic Canvas
  - Node.js Express 5 Security Gateway & Dual-Persistence Layer
  - Python 3.12 FastAPI Machine Learning Microservice
  - Role-Based Admin Command Center

---

## 📽️ Slide 2: Problem Statement
- **The Challenge**:
  - Traditional navigation platforms (Google Maps, Apple Maps) optimize strictly for **shortest distance** or **fastest travel time**.
  - Vulnerable pedestrians, students, and night commuters frequently face poorly lit, high-crime, or isolated streets.
- **The Need**:
  - A navigation paradigm that puts **personal safety first**, factoring in street lighting, historical crime data, accident frequency, and foot traffic density.

---

## 📽️ Slide 3: Proposed Solution
- **Multi-Factor Safety Assessment**: Evaluates journeys on a 0–100 safety score before you travel.
- **Dynamic Safety Priorities**:
  - 🌙 **Well-Lit Night Walk**: Maximizes illumination and bystander presence.
  - ⚡ **Direct Commute**: Balances speed with safety factors.
  - 🛡️ **Maximum Caution**: Strict zero-tolerance for crime and accident hazards.
  - 🎛️ **Custom Tuners**: Interactive sliders to adjust parameters.
- **Visual Safety Meters**: Immediate graphical breakdown across illumination, crime suppression, and pedestrian density.

---

## 📽️ Slide 4: System Architecture
```
[ User Browser / Client (React 19 + Vite) ]
                     │  HTTPS / WSS / JWT
                     ▼
[ Express 5 API Gateway (:5000) ]
   ├── Authentication & RBAC (JWT + OTP)
   ├── Rate Limiting & Helmet Guard
   ├── MongoDB / In-Memory Dual Store
   └── AI Prediction Proxy
                     │  HTTP / Internal Service Binding
                     ▼
[ Python FastAPI Microservice (:8000) ]
   └── Random Forest Safety Scoring Model
```
- **Deployment**: Monorepo orchestration via Docker Compose and Vercel cloud rewrites.

---

## 📽️ Slide 5: AI Scoring Engine & Model
- **Algorithm**: Random Forest Classifier / Regressor trained on urban safety datasets.
- **Input Dimensions**:
  1. Street Illumination Index (0–10)
  2. Crime Risk Coefficient (0–10)
  3. Historical Accident Frequency (0–10)
  4. Pedestrian / Foot Traffic Density (0–10)
- **Output**: Calibrated 0–100 Safety Score with Confidence Tier (🌟 High Safety, ⚠️ Moderate Caution, 🚨 High Caution) + Contextual Safety Advisories.
- **Fault-Tolerant Fallback**: Automated mathematical synthetic scoring if model serialization libraries are restricted.

---

## 📽️ Slide 6: Enterprise Authentication & RBAC
- **6-Digit Cryptographic OTP**:
  - Distributed via Nodemailer for account verification and password reset.
  - 10-minute validity, 60-second cooldown, brute-force throttled (6 req/15m).
- **Dual-Token Architecture**:
  - Short-lived Access Token in memory (prevents XSS theft).
  - Long-lived `httpOnly` Refresh Token with automatic token rotation (RTR).
- **Role-Based Access Control (RBAC)**:
  - `user`: Standard route search and personalized scoring.
  - `admin`: Elevated administrative command capabilities.

---

## 📽️ Slide 7: Admin Command Center
- **System Telemetry**: Real-time server uptime, RAM usage (MB), and network latency.
- **Microservices Health Monitoring**: Live status of FastAPI (Port 8000), Express (Port 5000), Database, and Mail Gateway.
- **User Management Directory**:
  - Inspect all accounts with verification status.
  - 1-Click Promote/Demote between Admin and User roles.
  - Delete compromised or obsolete accounts.
- **AI Model Simulator**: Live inference test bench directly within the admin console.

---

## 📽️ Slide 8: Testing, CI/CD & DevOps
- **Automated Test Suite**:
  - 28 Automated Unit & E2E tests passing with 0 failures (`npm test`).
  - Cryptographic validation, OTP lifecycle, E2E auth flow, and admin authorization tests.
- **GitHub Actions CI Pipeline**:
  - Continuous Integration workflow running linting, TypeScript typechecking, and automated test execution on every commit.
- **Dockerization**:
  - Isolated Dockerfiles for `frontend`, `backend`, and `ai` with `docker-compose.yml`.

---

## 📽️ Slide 9: Live Demo Flow (3 Minutes)
1. **Homepage Experience**: Showcase interactive DotGrid canvas and safety priority presets.
2. **Safety Route Search**: Search route with custom factor sliders & review the generated safety score and breakdown meters.
3. **User Authentication**: Demonstrate 1-click Auto-fill and OTP verification.
4. **Admin Command Center**: Access `/admin` & show telemetry, user management, and the AI model simulator.

---

## 📽️ Slide 10: Future Roadmap & Q&A
- **Phase 2 Additions**:
  - Integration with OpenStreetMap / Google Maps Routing API for turn-by-turn navigation.
  - Crowdsourced real-time hazard reporting & Emergency SOS triggers.
  - Native iOS and Android mobile applications (React Native).
- **Q&A Session**: Open for evaluator questions.
