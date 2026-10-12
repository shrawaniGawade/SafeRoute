# Functional Requirements Document (FRD)

**Project:** SafeRoute – AI-Powered Safety-Aware Route Recommendation System
**Document ID:** FRD01
**Version:** 1.0
**Date:** 11 October 2026
**Prepared by:** Pratik Dawane
**Related documents:** [BRD01](BRD01.md) · [SRS01](SRS01.md) · [API Documentation](API_DOCUMENTATION.md)

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Functional Overview](#2-functional-overview)
3. [Module 1 – Authentication](#3-module-1--authentication)
4. [Module 2 – Route Search and Map](#4-module-2--route-search-and-map)
5. [Module 3 – Safety Scoring and Recommendation](#5-module-3--safety-scoring-and-recommendation)
6. [Module 4 – ML Risk Prediction](#6-module-4--ml-risk-prediction)
7. [Module 5 – Emergency Services](#7-module-5--emergency-services)
8. [Module 6 – User Dashboard](#8-module-6--user-dashboard)
9. [Module 7 – Admin Dashboard](#9-module-7--admin-dashboard)
10. [Validation Rules Summary](#10-validation-rules-summary)
11. [Error Handling Summary](#11-error-handling-summary)
12. [Permission Summary](#12-permission-summary)
13. [Functional Test Scenarios](#13-functional-test-scenarios)

---

## 1. Purpose

The BRD says **why** SafeRoute is needed and the SRS says **what** it must do. This FRD explains **how each feature behaves step by step**: the workflow, inputs, validations, permissions, expected results, and error cases. Developers build from it and testers write test cases from it.

Each feature below has:
- **Explanation**: what it does and why, in short
- **Actors and trigger**
- **Main flow**: the normal steps
- **Alternate and error flows**
- **Validations**
- **Expected result**

---

## 2. Functional Overview

| Module | Features | Actors |
|---|---|---|
| M1 Authentication | Register, OTP verify, login, refresh, logout, forgot and reset password | Guest, User, Admin |
| M2 Route Search & Map | Geocode, alternatives, map display, route cards | All |
| M3 Safety Scoring | Factor scores, weighted score, risk level, recommendation, explanation | System |
| M4 ML Prediction | Predict risk, fallback, model info | System, Admin |
| M5 Emergency | Facility markers, Emergency Mode | All |
| M6 User Dashboard | History, preferences, favourites | User |
| M7 Admin Dashboard | Statistics, users, safety records, weights, audit log | Admin |

**Main user journey:**
```
Landing → Enter origin & destination → View routes on map → Compare scores
       → See recommendation + breakdown → (Logged in) Save to history
```

---

## 3. Module 1 – Authentication

### F1.1 Register
**Explanation:** Creates an account so the user can save routes. The email is verified with an OTP before the account becomes active, which prevents fake sign-ups.

- **Actor:** Guest · **Trigger:** clicks "Sign up"
- **Main flow:**
  1. The user enters name, email, password, and confirm password.
  2. The frontend checks the fields and shows a password-strength meter.
  3. `POST /api/auth/register` → the backend validates with Zod, hashes the password, and saves the user with `isVerified = false`.
  4. A 6-digit OTP is emailed, and the UI moves to the OTP screen.
- **Alternate and error flows:**
  - Email already registered → *"Unable to register with these details"* (generic, to prevent enumeration).
  - Too many attempts → 429 *"Too many requests, try again later."*
- **Validations:** name 2–50 characters · valid email · password ≥ 8 characters with a letter and a number · passwords match.
- **Expected result:** an unverified account is created and the OTP is sent.

### F1.2 Verify OTP
**Explanation:** Confirms that the user owns the email address.

- **Main flow:** the user enters the OTP → `POST /api/auth/verify-otp` → the account is verified → the user is logged in automatically (tokens issued).
- **Error flows:** wrong code (attempts remaining are shown) · expired (10 minutes) · 5 failures → the OTP is locked and the user must resend.
- **Resend:** `POST /api/auth/resend-otp`, allowed only after the 60-second cooldown (a countdown is shown).
- **Expected result:** `isVerified = true`, and the user lands on the route planner.

### F1.3 Login
**Explanation:** Signs in a verified user. A short-lived access token is kept in memory and a refresh token is set as an `httpOnly` cookie.

- **Main flow:** email and password → `POST /api/auth/login` → bcrypt compare → access token (15 minutes) and refresh cookie (7 days) → the navbar shows the user's name (and an Admin badge if they are an admin).
- **Error flows:** wrong credentials → *"Invalid email or password"* · unverified → redirected to OTP · rate limit → 429.
- **Expected result:** the user is authenticated, and the session survives a page refresh through silent refresh.

### F1.4 Session Refresh and Logout
**Explanation:** Keeps the user logged in safely. Every refresh gives a new token and revokes the old one, so a stolen token stops working after it is used.

- **Refresh:** on a 401 or on app load → `POST /api/auth/refresh-token` → a new pair of tokens is issued. If a revoked token is reused, all of that user's sessions are revoked.
- **Logout:** `POST /api/auth/logout` → the refresh token is revoked → the cookie is cleared → the user returns to the landing page.

### F1.5 Forgot and Reset Password
**Explanation:** Lets a user recover their account without revealing which emails are registered.

- **Main flow:** enter email → `POST /api/auth/forgot-password` → the same success message is always shown → OTP and new password → `POST /api/auth/reset-password` → the password is updated and all sessions are revoked.
- **Validations:** OTP valid and not expired · the new password follows the registration rules.
- **Expected result:** the user can log in with the new password and old sessions no longer work.

---

## 4. Module 2 – Route Search and Map

### F2.1 Location Search (Geocoding)
**Explanation:** Converts a typed place name into map coordinates.

- **Actor:** All · **Trigger:** types in the Origin or Destination field
- **Main flow:**
  1. After at least 3 characters and a 400 ms debounce, the app requests suggestions.
  2. Up to 5 suggestions are shown in a dropdown.
  3. The user picks one → its coordinates are stored → a marker is placed on the map.
- **Error flows:** no results → *"No places found"* · provider down → *"Search unavailable, try again."*
- **Validations:** both fields must be filled · origin ≠ destination.

### F2.2 Get Alternative Routes
**Explanation:** Gets several possible routes so they can be compared on safety.

- **Trigger:** clicks "Find Safe Routes"
- **Main flow:**
  1. `POST /api/routes/search` with `{origin, destination, departureTime}`.
  2. The backend asks the routing provider for up to 3 alternatives.
  3. Each route is scored (Module 3) and the routes are ranked.
  4. The response contains routes with geometry, distance, duration, score, risk, factors, and the recommended index.
- **Error flows:**

| Situation | User message |
|---|---|
| No route found | "No route available between these points." |
| Only 1 route returned | Shown normally, with a note: "Provider returned one route." |
| API limit hit (429) | "Route service is busy. Please retry in a minute." |
| Provider or network failure | "Couldn't load routes." plus a Retry button |

- **Expected result:** routes are drawn on the map and the route cards are filled in.

### F2.3 Map Display and Route Cards
**Explanation:** Shows the routes visually and keeps the map and the list in sync.

- Each route is drawn in its own colour. The recommended route is thicker and has a "Recommended" badge.
- Clicking a card highlights that route on the map, and clicking a route on the map selects its card.
- Each card shows: route name (A/B/C), distance (km), ETA (min), Safety Score, and risk label.
- A skeleton is shown on the cards while results load.
- On mobile, the cards appear in a bottom sheet that can be swiped.

---

## 5. Module 3 – Safety Scoring and Recommendation

### F3.1 Compute Factor Scores
**Explanation:** Turns raw data along a route into six factor scores from 0 to 100, where higher is better.

- **Process:**
  1. Sample points along the route geometry, about every 200 m.
  2. For each point, query nearby `safetyRecords` and `emergencyLocations` (geospatial query, about a 250 m radius).
  3. Average the values for each factor and normalize them to 0–100.
  4. Compute the time factor from the departure hour.

| Factor | Default weight | How it is derived |
|---|:---:|---|
| Lighting | 25% | Average lighting record (OSM `lit` tag or sample data) |
| Crime | 25% | 100 − normalized incident density |
| Accident | 20% | 100 − normalized accident density |
| Activity | 10% | Activity proxy (POI density), if available |
| Time of day | 10% | Day (06–18) = 100 · Evening (18–22) = 70 · Night (22–06) = 40 |
| Emergency proximity | 10% | Based on the distance to the nearest facility |

### F3.2 Compute Safety Score
**Explanation:** Combines the factors into one number. Missing data is never treated as safe.

- `Score = Σ (weight × factorScore)` over the factors that have data, with their weights scaled up so they total 100%.
- `Coverage % = sum of the weights of factors that have data`.
- If coverage is below 60%, the result is **"Insufficient data"** and no number is shown.
- **Risk level:** ≥ 75 Low · 50–74 Moderate · < 50 High.

**Worked example:**

| Factor | Score | Weight | Contribution |
|---|:---:|:---:|:---:|
| Lighting | 90 | 0.25 | 22.5 |
| Crime | 88 | 0.25 | 22.0 |
| Accident | 92 | 0.20 | 18.4 |
| Activity | 80 | 0.10 | 8.0 |
| Time | 95 | 0.10 | 9.5 |
| Emergency | 85 | 0.10 | 8.5 |
| **Total** | | | **88.9 → Low risk** |

*(These are example values, not data about a real location.)*

### F3.3 Recommend a Route
**Explanation:** Chooses the safest route that is still practical.

1. Find the fastest ETA.
2. Remove routes that are slower than the fastest by more than the maximum detour (default: the smaller of +25% or +10 minutes, or the user's own preference).
3. Remove routes marked "Insufficient data".
4. Pick the highest score. If scores are within 2 points, pick the shorter ETA.
5. If no route is left → *"No route meets your detour limit. Showing all options."*

### F3.4 Explain the Recommendation
**Explanation:** Users trust a result more when they can see why it was chosen.

- **Summary line:** *"Route B is recommended: +2 min vs fastest, +29 safety points."*
- **Factor bars:** a score and a one-line reason for each factor, e.g. *"Lighting 90/100: well-lit roads in available records."*
- **Data panel:** coverage %, the source of each factor, the last-updated date, and a **"Sample data"** badge where it applies.
- **Disclaimer (always shown):** *"Scores reflect available data only and do not guarantee safety."*

---

## 6. Module 4 – ML Risk Prediction

### F4.1 Predict Risk
**Explanation:** A trained scikit-learn model (with a Logistic Regression baseline and Random Forest as the selected model) estimates incident risk from route features. It adds an independent, data-driven estimate alongside the rule-based score.

- **Main flow:**
  1. The backend builds a feature vector (lighting, crime, accident, crowd, hour, and so on).
  2. `POST /api/safety/predict` → backend → FastAPI `POST /predict` (3-second timeout).
  3. The response contains `safety_score`, the model name and version, `data_type`, and a warning.
  4. The UI shows "AI risk estimate" next to the rule-based score.
- **Fallback flow:** if the ML service times out or errors → use the rule-based score only → show the badge *"AI estimate unavailable — rule-based score shown."*
- **Validations:** all features are numeric and within their expected range. Otherwise the request returns 400.

### F4.2 Model Information
**Explanation:** Shows openly what the model is and how well it performs.

- `GET /model-info` returns the model type, version, training date, dataset name, and test metrics (precision, recall, F1, ROC-AUC).
- These details appear in the admin dashboard and in a "How is this calculated?" popover.

---

## 7. Module 5 – Emergency Services

### F5.1 Emergency Facility Markers
**Explanation:** Shows where help is available along the route. The same data feeds the emergency-proximity factor.

- `GET /api/emergency-locations?lat=&lng=&radius=` returns hospitals, police stations, and fire stations.
- Each type has its own map icon. Clicking one shows the name, the type, and the source (e.g. "OpenStreetMap").
- The user can show or hide each facility type.

### F5.2 Emergency Mode
**Explanation:** A one-tap screen for urgent situations.

- **Trigger:** the "Emergency" button, which is always visible.
- **Shows:** national emergency numbers (112 · Police 100 · Ambulance 108 · Women helpline 1091), tap-to-call links, and the 3 nearest facilities with their distance.
- **Rule:** must not claim to alert or dispatch anyone. Only verified public numbers are shown.

---

## 8. Module 6 – User Dashboard

### F6.1 Save and View Route History
**Explanation:** Logged-in users can return to past searches.

- Searches are saved automatically after a successful search (only when logged in).
- `GET /api/routes/history?page=` lists the user's own searches, newest first, 10 per page.
- Each item shows origin → destination, date, and the recommended score. Clicking "View" replays it on the map.
- **Empty state:** *"No saved routes yet. Search a route to get started."*

### F6.2 Delete History
- `DELETE /api/routes/history/:id` → the backend checks `userId` matches → 204.
- If the item belongs to another user → 404 (its existence is not revealed).
- The UI asks for confirmation before deleting.

### F6.3 Preferences
**Explanation:** Lets users set how much extra time they will accept for a safer route.

- Fields: maximum detour (0–50% or 0–30 minutes) and default travel time (now, day, or night).
- `GET` / `PUT /api/user/preferences`. The new values apply to the next search.

### F6.4 Guest Prompt
- A guest who clicks "Save" sees *"Log in to save routes"* and the login modal opens.

---

## 9. Module 7 – Admin Dashboard

### F7.1 Access Control
**Explanation:** Only admins can manage the system, and this is checked on the server for every request.

- Every `/api/admin/*` request goes through `requireAuth` and then `requireRole('admin')`.
- No token → 401 · non-admin → 403 · the frontend admin route redirects non-admins.

### F7.2 Statistics and Telemetry
- `GET /api/admin/stats` returns total and verified users, admins, searches, ML service status (up or down), inference latency, server uptime, and memory.
- The dashboard refreshes the figures automatically every 30 seconds and shows a skeleton while it loads.

### F7.3 User Management
- List users with search.
- `PATCH /api/admin/users/:id/role` switches between user and admin.
- `DELETE /api/admin/users/:id` deletes a user after confirmation.
- **Rule:** an admin cannot demote or delete themselves.

### F7.4 Safety Record Management
**Explanation:** Admins keep the safety data accurate.

- Create, read, update, and delete through `/api/admin/safety-records`.
- **Validations:** factor ∈ {lighting, crime, accident, activity} · value 0–100 · coordinates are valid (lng −180 to 180, lat −90 to 90) · source is required · `isSample` flag.
- Each change updates `updatedAt` (used for freshness) and writes an audit log.

### F7.5 Scoring Weight Configuration
- Six sliders, one per factor (0–50% each), with a live total.
- The Save button is enabled only when the total is exactly 100%.
- "Reset to defaults" restores 25/25/20/10/10/10.
- Each change is written to the audit log with the before and after values.

### F7.6 Audit Log
- A read-only table showing time, admin, action, and target, newest first.

---

## 10. Validation Rules Summary

| Field | Rule | Message |
|---|---|---|
| Name | 2–50 characters | "Name must be 2–50 characters" |
| Email | Valid format, lowercased | "Enter a valid email" |
| Password | ≥ 8 characters, letter and number | "Min 8 chars with a letter and number" |
| OTP | Exactly 6 digits | "Enter the 6-digit code" |
| Origin / Destination | Required, must be different | "Choose two different locations" |
| Max detour | 0–50% or 0–30 min | "Detour must be within limits" |
| Weights | Each 0–50%, total exactly 100% | "Weights must total 100%" |
| Safety value | 0–100 | "Value must be 0–100" |
| Coordinates | lng −180–180, lat −90–90 | "Invalid coordinates" |
| Route ID params | Valid MongoDB ObjectId | 400 "Invalid ID" |

---

## 11. Error Handling Summary

| Code | Meaning | UI behaviour |
|---|---|---|
| 400 | Validation error | Errors shown next to each field |
| 401 | Not logged in or token expired | Silent refresh, then the login modal |
| 403 | Not allowed (role) | "You don't have permission" page |
| 404 | Not found, or not the owner | "Item not found" |
| 409 | Conflict | Generic message |
| 429 | Rate limited | "Too many requests" with the retry time |
| 500 / 503 | Server or provider failure | Friendly message, Retry button, fallback where possible |

Raw error objects or stack traces are never shown to users.

---

## 12. Permission Summary

| Function | Guest | User | Admin |
|---|:---:|:---:|:---:|
| Search routes, view scores and emergency info | ✅ | ✅ | ✅ |
| Save, view, and delete own history | ❌ | ✅ | ✅ |
| Edit own preferences | ❌ | ✅ | ✅ |
| View admin statistics | ❌ | ❌ | ✅ |
| Manage users, safety records, and weights | ❌ | ❌ | ✅ |

---

## 13. Functional Test Scenarios

| TC | Scenario | Expected result |
|---|---|---|
| TC-01 | Register with valid details | Account is created and the OTP is sent |
| TC-02 | Register with an existing email | Generic error; no account is created |
| TC-03 | Enter the wrong OTP 5 times | OTP is locked; the user must resend |
| TC-04 | Login with a wrong password | "Invalid email or password" |
| TC-05 | Reuse a revoked refresh token | 401; all of that user's sessions are revoked |
| TC-06 | Search valid origin and destination | Routes are drawn with distance, ETA, and score |
| TC-07 | Routing API returns 429 | Rate-limit message with Retry |
| TC-08 | Score matches the formula | Calculated value equals the expected weighted sum |
| TC-09 | Route with coverage < 60% | Shows "Insufficient data"; it is not recommended |
| TC-10 | Safest route exceeds the max detour | Not recommended; the next eligible route is chosen |
| TC-11 | ML service down | Rule-based score is shown with the fallback badge |
| TC-12 | Save a route, then refresh the page | Route appears in history |
| TC-13 | Delete another user's history item | 404 |
| TC-14 | A normal user calls `/api/admin/stats` | 403 |
| TC-15 | Admin saves weights that total 95% | Save is blocked with "Weights must total 100%" |
| TC-16 | Open on a 360 px mobile screen | No horizontal scroll; bottom sheet works |
