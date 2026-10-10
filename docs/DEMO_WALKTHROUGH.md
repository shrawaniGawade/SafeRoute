# SafeRoute 🛡️ - Live Demo Walkthrough Guide

> **Target Duration**: 3 to 4 Minutes  
> **Audience**: Technical Evaluators, Project Guides, Hackathon Judges

---

## 🛠️ Pre-Demo Setup Checklist

1. Ensure the 3 services are running:
   - Backend: `http://localhost:5000` (Status: `http://localhost:5000/api/health`)
   - Frontend: `http://localhost:5173`
   - AI Service: `http://127.0.0.1:8000/docs`
2. Open a clean browser tab at: **`http://localhost:5173`**
3. Keep Admin credentials handy:
   - **Email**: `admin@saferoute.com`
   - **Password**: `Admin@12345`

---

## ⏱️ Step-by-Step Demo Flow

### 0:00 – 0:45 | Scene 1: Introduction & Route Safety Search
1. **Showcase Landing Page**:
   - Point out the dynamic DotGrid interactive canvas (responsive to cursor movement).
   - Explain the core premise: *"Traditional navigation only checks speed; SafeRoute prioritizes human safety."*
2. **Select Route Priority**:
   - Click **"Custom Factors"** to reveal the 4 factor sliders (Street Lighting, Crime Risk, Accident Risk, Crowd Level).
   - Enter:
     - Starting Point: `Deccan Gymkhana, Pune`
     - Destination: `Koregaon Park, Pune`
   - Click **"Find a Safe Route"** (Sparkles button).
3. **Analyze Result Card**:
   - Point out the circular score badge (e.g. `86/100`).
   - Highlight the 4 progress breakdown meters:
     - 💡 Street Illumination
     - 🛡️ Crime Suppression Index
     - 🚦 Traffic Hazard Safety
     - 👥 Bystander Activity
   - Read out the contextual **Route Safety Advisory**.

---

### 0:45 – 1:45 | Scene 2: Enterprise Authentication & OTP Flow
1. Click **"Sign In"** in the top navbar.
2. Click **"Create one now"** to show the registration form:
   - Show the interactive password strength validator (requires uppercase, lowercase, number, special char).
3. Switch back to **"Sign In"**:
   - Click the green **"Auto-fill Admin"** button (demonstrates developer ergonomics).
   - Click **"Sign In"**.
   - Show the success toast alert and the updated profile icon in the top right.

---

### 1:45 – 2:45 | Scene 3: Admin Command Center Console
1. Click **"🛡️ Admin Dashboard"** in the top navbar (or open `http://localhost:5173/#admin`).
2. **Overview & Telemetry Tab**:
   - Show live server uptime (e.g., `45m 12s`), Node memory footprint (`42 MB`), and active security shield.
3. **User Management Tab**:
   - Inspect the registered users directory.
   - Show the 1-click **"Promote / Demote"** role toggle button.
4. **Microservices Health Tab**:
   - Point out live indicators for Python FastAPI (Port 8000), Express API (Port 5000), Dual DB, and Mail Gateway.
5. **AI Model Simulator Tab**:
   - Adjust the sliders and click **"Test AI Prediction"**.
   - Show the immediate real-time inference executed by the FastAPI Random Forest engine.

---

### 2:45 – 3:30 | Scene 4: DevOps, CI/CD & Testing Defense
1. **Open GitHub Repository**:
   - Show clean `main` branch with green checkmark from **GitHub Actions CI**.
   - Show the 4 User Story Issues under the Issues tab.
2. **Automated Testing Defense**:
   - Mention the 28 automated tests covering cryptographic hashing, OTP lifecycle, and RBAC authorization with 100% pass rate.
3. **Conclusion**:
   - Summarize that SafeRoute is production-ready, containerized with Docker, and built for scalable urban safety navigation.
