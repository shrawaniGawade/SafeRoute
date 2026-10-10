# SafeRoute 🛡️
> **Smarter Journeys. Safer Choices.**

SafeRoute is a modern, safety-conscious navigation platform that evaluates travel routes using multi-dimensional safety parameters (lighting quality, crime risks, accident histories, and crowd levels) coupled with enterprise-grade authentication.

---

## ✨ Features

- **🛡️ Admin Command Center Dashboard**:
  - Live system telemetry: Server Uptime, Memory usage (MB), API Latency (ms), and active security policies.
  - User Management Directory: View all registered accounts, promote/demote administrator privileges with 1 click, and delete accounts.
  - Microservices Health: Real-time health monitoring of AI FastAPI (Port 8000), Express API Gateway (Port 5000), Dual-Layer Database, and Mail Gateway.
  - Interactive AI Model Simulator: Tune lighting, crime index, accident risk, and crowd density sliders with live AI score inference.
  - Direct URL access via `/admin` and `#admin`.
- **🗺️ Interactive Route Safety Evaluator**:
  - Route priority presets: 🌙 Well-Lit Night Walk, ⚡ Direct Commute, 🛡️ Maximum Caution, 🎛️ Custom Tuners.
  - Multi-variable risk assessment across illumination, crime, accidents, and crowds.
  - Visual metrics breakdown meters and context-aware Route Safety Advisories.
- **🔐 End-to-End Authentication**:
  - Default Admin Account seeded out of the box (`admin@saferoute.com` / `Admin@12345`) with 1-click Auto-fill in the login modal.
  - Secure Registration & Login with `bcryptjs` password hashing.
  - 6-Digit Cryptographic Numeric OTP for email verification and password recovery.
  - Dual-token architecture with in-memory Access Tokens & `httpOnly` Refresh Token Rotation (RTR).
  - Rate limiting, brute-force mitigation, and zero-enumeration password resets.
  - Live interactive password strength evaluator.
- **🤖 AI Route Safety Scoring**:
  - Real-time scoring microservice built with FastAPI and Scikit-Learn with resilient synthetic fallback.
- **⚡ Modern Responsive UI**:
  - React 19 + TypeScript + Vite.
  - GSAP-powered interactive DotGrid background canvas.
  - Glassmorphic modal overlays, custom toast alerts, and responsive layouts.
- **☁️ Multi-Service Cloud Architecture**:
  - Pre-configured for seamless Vercel deployment with automated microservice rewrites.
- **📸 Exported Visual Previews**:
  - Complete application flow and admin dashboard screenshots archived in `screenshots/`.

---

## 🏗️ Repository Architecture

```
SafeRoute/
├── ai/          # Python FastAPI Safety Prediction Microservice
├── backend/     # Express 5 + TypeScript + MongoDB Authentication & Gateway
├── frontend/    # React 19 + TypeScript + Vite Single-Page Application
├── docs/        # Comprehensive Project & API Documentation
└── vercel.json  # Multi-Service Cloud Deployment Specification
```

---

## 📚 Documentation Links

- 📖 [Project Overview](docs/PROJECT_OVERVIEW.md) - High-level pillars and technical architecture.
- 🗂️ [Project Structure](docs/PROJECT_STRUCTURE.md) - Detailed directory layout and component breakdown.
- 🔌 [API Documentation](docs/API_DOCUMENTATION.md) - Full specification of all Auth and Safety endpoints.
- 🚀 [Setup & Run Guide](docs/SETUP_GUIDE.md) - Step-by-step local development setup and Vercel instructions.

---

## ⚡ Quick Start

### 1. Backend
```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

### 2. Frontend
```powershell
cd frontend
npm install
npm run dev
```

### 3. AI Service (Optional)
```powershell
cd ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 🛡️ Default Administrator Access

The platform auto-seeds an administrator account upon backend startup:

| Attribute | Value |
| :--- | :--- |
| **Direct URL** | `http://localhost:5173/admin` or `http://localhost:5173/#admin` |
| **Email** | `admin@saferoute.com` |
| **Password** | `Admin@12345` |
| **Convenience** | Click **"Auto-fill Admin"** inside the Sign In modal |

---

## 📸 Screenshots Gallery

High-resolution visual captures are stored in the [`screenshots/`](screenshots/) directory:
- `admin_dashboard_1791621746794.png`: Full Admin Command Center Dashboard
- `admin_dropdown_menu_1791621673939.png`: User menu with Admin badge and Console link
- `route_safety_evaluation_result_1791623499874.png`: Interactive AI Route Evaluation Result
- `verification_successful_page_1791619144737.png`: 6-digit OTP email verification
- `register_modal_view_1791618662328.png`: Account registration with live password validator

---

## 🔒 Security Best Practices Implemented

1. **XSS Protection**: Access token kept in memory; refresh token stored strictly in `httpOnly` cookies.
2. **CSRF Protection**: `SameSite=Lax` / `SameSite=Strict` cookie policies.
3. **Replay & Compromise Detection**: Refresh Token Rotation revokes the entire family if an already-revoked token is replayed.
4. **Brute Force Protection**: Endpoint rate limiting via `express-rate-limit` (15/15m on auth, 6/15m on OTPs).
5. **Anti-Enumeration**: Consistent generic messaging on password reset prevents user account discovery.
6. **HTTP Hardening**: Security headers injected via `helmet()`.

---

## 📄 License
ISC License © 2026 SafeRoute
