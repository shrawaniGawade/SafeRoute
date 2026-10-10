# SafeRoute - Setup & Installation Guide

This guide covers everything required to run SafeRoute locally, test each microservice, and deploy to production.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.x or later (v20+ recommended)
- **npm**: v9.x or later
- **Python**: v3.10+ (for the AI scoring microservice)
- **MongoDB**: Local MongoDB instance (or free MongoDB Atlas cloud cluster)
- **Git**

---

## 2. Quick Start (Development)

### Step 2.1: Clone the Repository
```powershell
git clone https://github.com/shrawaniGawade/SafeRoute.git
cd SafeRoute
```

### Step 2.2: Setup Backend (`backend`)
1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Create your `.env` file from the example:
   ```powershell
   Copy-Item .env.example .env
   ```
4. Verify/update your `.env` variables:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/saferoute # Or MongoDB Atlas connection URI
   JWT_ACCESS_SECRET=your_dev_access_secret_key_min32chars
   JWT_REFRESH_SECRET=your_dev_refresh_secret_key_min32chars
   FRONTEND_URL=http://localhost:5173

   # Optional SMTP (leave empty to log verification OTP codes directly to terminal)
   SMTP_HOST=
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASS=
   ```
5. Start the backend development server:
   ```powershell
   npm run dev
   ```
   The backend will be running at `http://localhost:5000`.

---

### Step 2.3: Setup Frontend (`frontend`)
1. Open a new terminal and navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   The frontend will be accessible at `http://localhost:5173`.

---

### Step 2.4: Setup AI Microservice (`ai`) - Optional for Route Prediction
1. Open a new terminal and navigate to the AI microservice directory:
   ```powershell
   cd ai
   ```
2. Create and activate a virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```

---

## 3. Testing Authentication Endpoints

SafeRoute features built-in development logging. When a user registers or requests password reset:
1. Open `http://localhost:5173` and click **"Sign In"** -> **"Create Account"**.
2. Enter name, email, and password.
3. Check your backend terminal output to view the dispatched OTP code:
   ```
   ---------------------------------------------------------
   [SafeRoute Email Dispatch]
   To: test@example.com
   Purpose: EMAIL_VERIFICATION
   Code: >>> 839210 <<<
   ---------------------------------------------------------
   ```
4. Type or paste `839210` into the 6-digit OTP input on the frontend.
5. The account is immediately verified and signed in!

---

## 4. Production Deployment on Vercel

SafeRoute is pre-configured with [vercel.json](file:///c:/Users/shraw/OneDrive/Desktop/SafeRoute/vercel.json) for multi-service deployment:
- **Backend Service**: Root `/backend`, entry point `src/server.ts`.
- **Frontend Service**: Root `/frontend`, framework `vite`.
- **AI Service**: Root `/ai`, framework `fastapi`, entry point `app.main:app`.
- **Rewrites**: All `/api/*` routes are proxied to the backend, and remaining routes are handled by the Vite single-page app.

Ensure you configure the environment variables (`MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, and SMTP keys) in your Vercel Project Settings under Environment Variables.
