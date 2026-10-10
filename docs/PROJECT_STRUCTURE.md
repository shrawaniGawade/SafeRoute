# SafeRoute - Project Structure

This document details the file tree, module responsibilities, and data flows within the SafeRoute repository.

```
SafeRoute/
├── .gitignore
├── README.md
├── vercel.json                         # Multi-service Vercel deployment specification
│
├── docs/                               # Project documentation
│   ├── API_DOCUMENTATION.md            # Complete API endpoints and payload schemas
│   ├── PROJECT_OVERVIEW.md             # High-level architecture and feature pillars
│   ├── PROJECT_STRUCTURE.md            # Directory and file organization (this file)
│   └── SETUP_GUIDE.md                  # Local installation, environment variables, and run guide
│
├── ai/                                 # Machine Learning Scoring Microservice
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI server exposing /predict
│   │   └── schemas.py                  # Pydantic input/output schemas
│   ├── data/                           # Route and safety datasets
│   ├── model/                          # Trained Scikit-Learn model artifacts (.pkl/.joblib)
│   └── requirements.txt                # Python dependencies (fastapi, scikit-learn, etc.)
│
├── backend/                            # Express 5 + TypeScript API Backend
│   ├── .env.example                    # Sample environment variables
│   ├── package.json                    # Backend dependencies and run scripts
│   ├── tsconfig.json                   # TypeScript configuration
│   └── src/
│       ├── config/
│       │   ├── db.ts                   # MongoDB connection pool & error handling
│       │   └── env.ts                  # Typed environment configuration loader
│       ├── controllers/
│       │   └── authController.ts       # Auth handlers: register, login, OTP, token rotation, reset
│       ├── middleware/
│       │   ├── authMiddleware.ts       # requireAuth and optionalAuth JWT guards
│       │   ├── rateLimiter.ts          # Express-rate-limiters for auth & OTP endpoints
│       │   └── validate.ts             # Generic Zod request schema validation middleware
│       ├── models/
│       │   ├── User.ts                 # Mongoose User schema with pre-save bcrypt hashing
│       │   ├── Otp.ts                  # Mongoose Otp schema with SHA-256 hash & TTL auto-expiry
│       │   └── RefreshToken.ts         # Mongoose RefreshToken schema with RTR family tracking
│       ├── routes/
│       │   └── authRoutes.ts           # Express router defining /api/auth/* endpoints
│       ├── services/
│       │   ├── aiService.ts            # Proxy client to Python AI microservice
│       │   ├── emailService.ts         # Branded HTML email delivery with dev console fallback
│       │   └── tokenService.ts         # JWT Access & Refresh Token creation, rotation & revocation
│       ├── utils/
│       │   ├── crypto.ts               # Cryptographic random numeric OTP generator & SHA-256
│       │   └── validators.ts           # Zod 4 schemas for all authentication forms
│       └── server.ts                   # Express server entry point wiring CORS, Helmet & routes
│
└── frontend/                           # React 19 + TypeScript + Vite Single Page Application
    ├── index.html
    ├── package.json                    # Frontend dependencies (react 19, gsap, lucide-react, vite)
    ├── vite.config.ts                  # Vite build configuration
    └── src/
        ├── App.css                     # Primary styles, layouts, dropdowns, and toast banners
        ├── App.tsx                     # Main application view with navbar, hero & route form
        ├── index.css                   # Global reset, typography, and theme custom properties
        ├── main.tsx                    # Root mounting wrapped in AuthProvider
        ├── assets/                     # Static images and icons
        ├── components/
        │   ├── DotGrid.tsx             # Interactive canvas particle grid background
        │   ├── DotGrid.css
        │   └── auth/                   # Complete authentication UI module
        │       ├── AuthModal.tsx       # Accessible modal hosting auth views with tabs
        │       ├── AuthModal.css       # Glassmorphism, animations, and inputs styling
        │       ├── LoginForm.tsx       # Login form with password toggle & recovery links
        │       ├── RegisterForm.tsx    # Sign-up form with live 4-tier password strength meter
        │       ├── OtpForm.tsx         # 6 auto-focusing numeric boxes, paste & 60s cooldown
        │       ├── ForgotPasswordForm.tsx # Step 1 password recovery email requester
        │       └── ResetPasswordForm.tsx  # Step 2 OTP verification & new password assignment
        ├── context/
        │   └── AuthContext.tsx         # React Auth context: user profile, silent restore, actions
        └── services/
            ├── api.ts                  # Fetch client with active token injection & refresh handler
            └── authService.ts          # Strongly-typed auth API service with cookie credentials
```
