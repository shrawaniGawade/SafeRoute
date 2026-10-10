# SafeRoute - Project Overview

## 1. Introduction
**SafeRoute** is an intelligent, safety-conscious navigation and route recommendation platform designed to empower travelers with risk assessments, safety scoring, and secure identity management.

While conventional mapping applications optimize exclusively for travel time and distance, **SafeRoute** integrates multi-dimensional safety parameters (lighting quality, crime risks, accident histories, crowd densities) to provide actionable safety evaluations for journeys.

---

## 2. Core Pillars

### 🛡️ Safety-First Route Scoring
- Multi-variable risk analysis incorporating road illumination, historical crime indices, accident frequency, and real-time/demographic crowd levels.
- Machine Learning models (FastAPI AI engine using Random Forest regression/classification) serving predictive safety scores from 0 to 100.

### 🔐 Enterprise-Grade Authentication & Session Security
- **Dual-Token Architecture**: Short-lived in-memory Access Tokens (15 min) paired with `httpOnly`, `Secure`, `SameSite=Lax` Refresh Tokens (7 days).
- **Refresh Token Rotation (RTR)**: Mitigates replay attacks with automatic token revocation upon compromise detection.
- **Two-Factor OTP Security**: Cryptographically secure 6-digit numeric verification codes for email registration and password recovery with strict attempt limits (max 5) and cooldown timers (60s).
- **Zero Enumeration & Timing-Safe Verification**: Protection against user enumeration during password reset and constant-time password comparisons via `bcryptjs`.
- **Defensive Middleware**: Centralized Zod request validation, rate limiting per endpoint, and HTTP security headers powered by `helmet`.

### ⚡ Modern, Responsive User Experience
- Built with React 19, TypeScript, and Vite.
- Sleek interactive interface featuring dynamic GSAP-powered canvas dot grids, glassmorphism modal overlays, real-time password strength evaluation, and responsive design across desktop and mobile devices.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, GSAP, Lucide React, Vanilla CSS |
| **Backend API** | Node.js, Express 5, TypeScript, TSX, Helmet, Cookie-Parser, CORS |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), Bcrypt (`bcryptjs`), Crypto, Nodemailer |
| **Validation** | Zod 4 Schema Validation, Express Rate Limit |
| **Database** | MongoDB Atlas, Mongoose 9 (with TTL auto-expiry indexes) |
| **AI / ML Service** | Python 3.10+, FastAPI, Scikit-Learn, Joblib, Uvicorn |
| **Cloud Deployment** | Vercel Multi-Service (`vercel.json`) |

---

## 4. Architecture Diagram

```
[ Client Browser / Frontend (React 19) ]
         │               ▲
         │ (JSON / HTTP) │ (In-Memory Access Token / httpOnly Cookie)
         ▼               │
[ Express 5 Backend API Gateway ]
    ├── /api/auth/*     ──> Mongoose 9 (Users, OTPs, RefreshTokens)
    │                       & Nodemailer Email Dispatcher
    └── /api/safety/*   ──> FastAPI Python Safety Prediction Service
                                (Random Forest Model)
```
