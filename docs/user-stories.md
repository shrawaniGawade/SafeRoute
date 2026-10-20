# 📖 SafeRoute User Stories & Acceptance Criteria

> **Document Version**: 1.0.0  
> **Status**: Agile Requirement Stories & Testing Criteria  

---

## Epic 1: User Onboarding & Authentication

### US-1.1: New User Account Registration
**As a** new commuter,  
**I want to** register an account using my name, email, and a secure password,  
**So that** I can access personalized route safety evaluations.

#### Acceptance Criteria:
- **Given** I am on the SafeRoute registration tab (`#/login`),
- **When** I submit an invalid email or a password with fewer than 8 characters,
- **Then** the form displays field-level error messages and prevents submission.
- **When** I submit a valid name, email, and strong password,
- **Then** the backend creates an unverified account, dispatches a 6-digit OTP to my email, and transitions the view to the OTP verification screen.

---

### US-1.2: Two-Factor 6-Digit Email OTP Verification
**As a** newly registered user,  
**I want to** verify my email address with a 6-digit one-time code,  
**So that** my account identity is verified and protected against unauthorized signups.

#### Acceptance Criteria:
- **Given** I have submitted my registration details,
- **When** I enter an invalid or expired OTP code,
- **Then** the application displays "Invalid or expired verification code" and keeps the input focused.
- **When** I enter the correct 6-digit code within 10 minutes,
- **Then** my account is marked verified, I receive an active session token, and I am automatically redirected to the Traveler Route Planner (`#/app`).

---

### US-1.3: User Login & Session Persistence
**As an** existing traveler,  
**I want to** log in with my verified credentials and remain logged in safely,  
**So that** I don't have to re-enter my password every time I open the website.

#### Acceptance Criteria:
- **Given** I am an unauthenticated user on the login screen,
- **When** I provide valid credentials for a standard user account,
- **Then** I receive a 15-minute access token in memory and an HttpOnly refresh token cookie, and I am redirected to `#/app`.
- **When** my 15-minute access token expires,
- **Then** the client silently calls `/api/auth/refresh-token` to acquire a new access token without interrupting my session.

---

### US-1.4: Direct Admin Login Redirection
**As a** system administrator,  
**I want to** be redirected directly to the Admin Command Center upon signing in,  
**So that** I can immediately access system metrics and administrative management tools.

#### Acceptance Criteria:
- **Given** I enter credentials for an administrator account (`admin@saferoute.com`),
- **When** I click "Sign In",
- **Then** the application detects `role === 'admin'`, sets the browser hash to `#/admin`, and renders the dedicated standalone Admin Command Center.

---

## Epic 2: Route Safety Evaluation & Risk Scoring

### US-2.1: Multi-Factor Safety Prediction
**As a** commuter planning a journey,  
**I want to** input my starting location and destination,  
**So that** the AI evaluates the environmental risk factors and generates a safety score.

#### Acceptance Criteria:
- **Given** I am on the Traveler Route Planner (`#/app`),
- **When** I input a valid origin and destination and click "Evaluate Route Safety",
- **Then** the application triggers the safety evaluation pipeline and displays a 0–100 Composite Safety Score, a risk badge (Low, Moderate, High), and a breakdown of lighting, crime, accident, and crowd indices.

---

### US-2.2: Safety Preset Selection
**As a** night commuter,  
**I want to** select pre-configured safety presets like "Night Traveler" or "Well-Lit",  
**So that** the algorithm automatically prioritizes illumination and foot traffic without manual slider adjustments.

#### Acceptance Criteria:
- **Given** I am viewing the safety profile selector,
- **When** I click the "Night Traveler" preset pill,
- **Then** the lighting factor is set to 9/10, crowd to 8/10, and crime risk tolerance to 1/10.
- **When** I trigger evaluation with this preset,
- **Then** the safety prediction reflects the customized prioritization.

---

### US-2.3: Custom Factor Weight Adjustment
**As an** experienced traveler with specific route needs,  
**I want to** manually adjust individual factor sliders for lighting, crime, accidents, and crowd density,  
**So that** I can customize the route assessment to my personal risk tolerance.

#### Acceptance Criteria:
- **Given** I toggle the "Custom Factor Tuners" panel,
- **When** I drag any slider between 1 and 10,
- **Then** the numerical indicator updates in real-time and recalculates the safety profile on the next route evaluation.

---

## Epic 3: Administrator Command Center

### US-3.1: Live System Telemetry Monitoring
**As an** administrator,  
**I want to** view real-time memory usage, server uptime, and microservice statuses,  
**So that** I can ensure the platform is healthy and operational.

#### Acceptance Criteria:
- **Given** I am logged in as an administrator on `#/admin`,
- **When** the Admin Dashboard loads,
- **Then** it automatically polls `/api/admin/stats` and displays server uptime, Node.js memory footprint, registered user counts, and AI microservice status.
- **When** I click "Sync Data",
- **Then** the telemetry refreshes immediately with updated values.

---

### US-3.2: User Role Management & Moderation
**As an** administrator,  
**I want to** promote trusted users to admin, demote accounts, or delete malicious users,  
**So that** I can maintain system integrity and delegate operational responsibilities.

#### Acceptance Criteria:
- **Given** I am on the "User Management" tab of the Admin Dashboard,
- **When** I click "Make Admin" on a standard user,
- **Then** the backend updates the user's role to `'admin'`, displays a success notification, and updates the table row.
- **When** I click "Delete" and confirm the browser alert,
- **Then** the user account is purged from the database and removed from the active user list.

---

### US-3.3: Interactive AI Model Probe
**As an** administrator,  
**I want to** test inference directly by adjusting lighting, crime, accident, and crowd inputs,  
**So that** I can benchmark model latency and verify prediction behavior.

#### Acceptance Criteria:
- **Given** I am on the "AI Model Probe" tab in the Admin Dashboard,
- **When** I adjust parameter sliders and click "Run AI Model Probe",
- **Then** the request is dispatched to the AI service and returns the predicted safety score, safety category, and execution latency in milliseconds (e.g. `12 ms`).

---

## Epic 4: Responsive Mobile Experience

### US-4.1: Seamless Smartphone Navigation
**As a** mobile user on a smartphone,  
**I want to** use the SafeRoute application without broken layouts or horizontal overflow,  
**So that** I can check route safety conveniently while walking.

#### Acceptance Criteria:
- **Given** I open SafeRoute on a screen width between 360px and 480px,
- **Then** the login card, header navigation, route inputs, safety meters, and 6-digit OTP boxes adapt to a fluid single-column layout with 0px horizontal scrolling.
- **When** I tap buttons or adjust sliders,
- **Then** touch targets are at least 44px by 44px for effortless one-handed use.
