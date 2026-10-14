# SafeRoute Backend API Design & Contract Specification

**System**: SafeRoute — AI-Powered Safety-Aware Route Recommendation System  
**Backend Framework**: Node.js v20+ / Express 5.x / TypeScript  
**Database**: MongoDB / Mongoose 9.x (with resilient in-memory fallback for local unit test environments)  
**AI Microservice**: Python FastAPI at `http://127.0.0.1:8000`  
**Base URL**: `http://localhost:5000`  
**Security Model**: JWT Access Token (15 min) + HttpOnly Refresh Token (7 days) with Refresh Token Rotation (RTR) & Family Invalidation  

---

## 1. Architecture & Design Principles

The backend architecture follows strict modular separation of concerns:
- **`routes/`**: Route definitions, HTTP method binding, and middleware pipelines.
- **`controllers/`**: Request orchestration, parameter extraction, and standardized response formatting.
- **`services/`**: Core business logic, external AI service integration (`aiService.ts`), and email dispatches (`emailService.ts`).
- **`middleware/`**: Authentication checks (`authenticate`), role verification (`requireRole`), body/query validation (`validateBody`), request timeout (15s), and centralized error handling (`errorHandler`).
- **`models/`**: Persistent Mongoose data schemas (`User`, `SafetyPrediction`, `RouteHistory`, `AuditLog`, `Otp`, `RefreshToken`).
- **`validators/`**: Declarative Zod schemas validating types, bounds, strings, and enums.
- **`config/`**: Environment configuration (`env.ts`) and database connectivity (`db.ts`).

### Common Response Headers
```http
Content-Type: application/json; charset=utf-8
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

### Security & Data Protection Guarantees
1. **Password Safety**: Passwords hashed with `bcryptjs` (salt work factor 12). Passwords, password hashes, and reset secrets are explicitly flagged `{ select: false }` and completely excluded from JSON serialization via model `toJSON` transformations.
2. **Audit Redaction**: `sanitizeAuditMetadata()` unconditionally scrubs keys named `password`, `token`, `otp`, `secret`, `authorization`, or `refreshToken` before recording administrative audit logs.
3. **Resilience**: If the Python AI microservice or MongoDB is offline, graceful fallbacks compute deterministic heuristics and preserve service continuity without crashing.

---

## 2. API Endpoints

### 2.1 Health & Diagnostic Area

#### `GET /health`
Root health check probe for cloud load balancers and orchestrators.

- **Auth Required**: None
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "saferoute-backend",
  "timestamp": "2026-10-15T00:41:40.123Z",
  "version": "1.0.0",
  "uptime": 124.52
}
```

#### `GET /api/health`
Aggregated telemetry inspecting backend uptime, memory usage, MongoDB status, and FastAPI AI service status.

- **Auth Required**: None
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "saferoute-backend",
  "timestamp": "2026-10-15T00:41:40.123Z",
  "version": "1.0.0",
  "uptime": 124.52,
  "memory": {
    "heapUsed": "48 MB",
    "heapTotal": "78 MB",
    "rss": "112 MB"
  },
  "database": {
    "status": "connected",
    "host": "127.0.0.1",
    "database": "saferoute",
    "pingLatencyMs": 1.4
  },
  "aiService": {
    "status": "online",
    "modelLoaded": true,
    "architecture": "RandomForestSafetyClassifier",
    "features": ["lighting", "crime_risk", "accident_risk", "crowd_level"],
    "latencyMs": 4.2
  }
}
```

#### `GET /api/health/db`
Dedicated database connectivity probe. Returns `200 OK` or `503 Service Unavailable`.

#### `GET /api/health/ai`
Dedicated AI microservice connectivity probe. Returns `200 OK` or `503 Service Unavailable`.

---

### 2.2 Authentication Area (`/api/auth`)

#### `POST /api/auth/register`
Initiates account registration and sends a 6-digit verification code.

- **Auth Required**: None
- **Rate Limit**: 15 requests / 15 minutes
- **Request Body**:
```json
{
  "name": "Jane Commuter",
  "email": "jane@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123"
}
```
- **Response `201 Created`**:
```json
{
  "message": "Registration initiated! Please enter the 6-digit verification code sent to your email.",
  "email": "jane@example.com",
  "devOtp": "492810"
}
```
- **Error `409 Conflict`**: Account with email already exists and is verified.
- **Error `400 Bad Request`**: Password too weak or fields missing.

#### `POST /api/auth/verify-otp`
Verifies 6-digit OTP code. For `EMAIL_VERIFICATION`, activates the user and establishes an authenticated session.

- **Auth Required**: None
- **Rate Limit**: 6 requests / 15 minutes
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "otp": "492810",
  "purpose": "EMAIL_VERIFICATION"
}
```
- **Response `200 OK`**:
```json
{
  "message": "Account verified successfully!",
  "user": {
    "id": "67a91fcb4e311002b80a1122",
    "name": "Jane Commuter",
    "email": "jane@example.com",
    "role": "user",
    "isVerified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Cookie Set**: `refreshToken=<secret>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`

#### `POST /api/auth/login`
Authenticates email and password credentials.

- **Auth Required**: None
- **Rate Limit**: 15 requests / 15 minutes
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "Password@123"
}
```
- **Response `200 OK`**:
```json
{
  "message": "Welcome back!",
  "user": {
    "id": "67a91fcb4e311002b80a1122",
    "name": "Jane Commuter",
    "email": "jane@example.com",
    "role": "user",
    "isVerified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Cookie Set**: `refreshToken=<secret>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
- **Error `401 Unauthorized`**: `{"message": "Invalid email or password."}`
- **Error `403 Forbidden`**: Pending verification (auto-dispatches fresh verification code).

#### `GET /api/auth/me`
Retrieves the authenticated user's session profile.

- **Auth Required**: `Bearer <accessToken>`
- **Response `200 OK`**:
```json
{
  "user": {
    "id": "67a91fcb4e311002b80a1122",
    "name": "Jane Commuter",
    "email": "jane@example.com",
    "role": "user",
    "isVerified": true,
    "lastLogin": "2026-10-15T00:30:00.000Z",
    "createdAt": "2026-10-15T00:20:00.000Z"
  }
}
```

#### `POST /api/auth/refresh` (or `/api/auth/refresh-token`)
Silent session refresh using HttpOnly cookie with Refresh Token Rotation (RTR).

- **Auth Required**: `Cookie: refreshToken=<token>`
- **Response `200 OK`**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Error `401 Unauthorized`**: `NO_REFRESH_TOKEN` or `SESSION_EXPIRED` (clears cookie).

#### `POST /api/auth/logout`
Revokes refresh token family and clears the session cookie.

- **Auth Required**: None (cleans up cookie if present)
- **Response `200 OK`**:
```json
{
  "message": "Logged out successfully."
}
```

---

### 2.3 Safety Prediction Area (`/api/safety`)

#### `POST /api/safety/predict`
Calculates route safety score by dispatching factors to the Python FastAPI microservice (`http://127.0.0.1:8000/predict`). Generates comparative route alternatives (primary safe corridor vs direct shortcut) via pluggable routing providers (OpenRouteService, OSRM, or demo sandbox). Persists result to database with user attribution if logged in. Supports idempotency via `clientRequestId`.

- **Auth Required**: Optional (attaches `userId` if valid token is provided)
- **Request Body**:
```json
{
  "lighting": 8.5,
  "crime_risk": 1.2,
  "accident_risk": 2.0,
  "crowd_level": 7.5,
  "emergency_proximity": 8.0,
  "origin": "North Station, Boston, MA",
  "destination": "Boston Public Library, MA",
  "departureTime": "22:30",
  "travelMode": "walking",
  "clientRequestId": "req-987123"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "predictionId": "67a920fa5c422101e40a5544",
    "safety_score": 87.4,
    "rating": "Optimal (Safe Route)",
    "model": "Random Forest Regressor (60-Tree Ensemble)",
    "latency_ms": 1.8,
    "factors": {
      "lighting_contribution": 28.9,
      "crowd_contribution": 17.2,
      "crime_deduction": 3.1,
      "accident_deduction": 3.4
    },
    "origin": "North Station, Boston, MA",
    "destination": "Boston Public Library, MA",
    "departureTime": "22:30",
    "travelMode": "walking",
    "data_type": "synthetic_ml_inference",
    "warning": "Demonstration only. Not validated for real-world emergency dispatch.",
    "scoring_explanation": "Evaluated by Random Forest Regressor (60-Tree Ensemble). Streetlighting contributed +28.9 points toward route illumination. Foot traffic density added +17.2 points for active bystander presence. Crime severity index deducted -3.1 points. Accident probability deducted -3.4 points. Emergency services proximity rated at 8/10, providing verified rapid-dispatch coverage. SafeRoute recommendation policy prioritizes illuminated and populated thoroughfares over shortest linear distance. DISCLAIMER: No route can be guaranteed 100% safe. Always remain aware of your surroundings and observe municipal advisories.",
    "is_navigable": false,
    "navigability_notice": "Demonstration mode: No external navigation provider configured. Set ROUTING_PROVIDER and ROUTING_API_KEY in .env to activate live turn-by-turn routing.",
    "routing_provider": "synthetic_demo",
    "alternatives": [
      {
        "id": "safe_corridor",
        "name": "Primary Safe Corridor (Recommended)",
        "safety_score": 87.4,
        "rating": "Optimal (Safe Route)",
        "isRecommended": true,
        "isNavigable": false,
        "distanceText": "Demo Estimate (1.8 km)",
        "durationText": "Demo Estimate (22 mins)",
        "summary": "Well-lit municipal thoroughfare with active commercial activity and pedestrian density.",
        "factors": {
          "lighting": 8.5,
          "crime_risk": 1.2,
          "accident_risk": 2.0,
          "crowd_level": 7.5,
          "emergency_proximity": 8.0
        }
      },
      {
        "id": "direct_shortcut",
        "name": "Direct Shortcut Alternative",
        "safety_score": 52.1,
        "rating": "Moderate Caution",
        "isRecommended": false,
        "isNavigable": false,
        "distanceText": "Demo Estimate (1.4 km - shorter)",
        "durationText": "Demo Estimate (17 mins)",
        "summary": "Traverses unmonitored back alleys and secondary industrial roads. Faster but darker.",
        "factors": {
          "lighting": 3.5,
          "crime_risk": 5.7,
          "accident_risk": 4.5,
          "crowd_level": 2.5
        }
      }
    ],
    "createdAt": "2026-10-15T00:41:40.123Z"
  }
}
```
- **Error `400 Bad Request`**: Validation error (factors must be numbers between 0 and 10).

#### `GET /api/safety/history`
Returns paginated list of safety predictions created by the authenticated caller.

- **Auth Required**: `Bearer <accessToken>`
- **Query Parameters**:
  - `page` (integer, default `1`)
  - `limit` (integer, default `10`, max `50`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "67a920fa5c422101e40a5544",
      "safety_score": 87.4,
      "rating": "Safe",
      "origin": "North Station, Boston, MA",
      "destination": "Boston Public Library, MA",
      "factors": {
        "lighting": 8.5,
        "crime_risk": 1.2,
        "accident_risk": 2.0,
        "crowd_level": 7.5
      },
      "travelMode": "walking",
      "createdAt": "2026-10-15T00:41:40.123Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalRecords": 1,
    "totalPages": 1
  }
}
```

#### `GET /api/safety/history/:id`
Retrieves full details of a specific prediction. Enforces resource-ownership: callers can only access their own predictions (or Admin access).

- **Auth Required**: `Bearer <accessToken>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "67a920fa5c422101e40a5544",
    "safety_score": 87.4,
    "rating": "Safe",
    "model": "RandomForestSafetyClassifier",
    "origin": "North Station, Boston, MA",
    "destination": "Boston Public Library, MA",
    "departureTime": "22:30",
    "travelMode": "walking",
    "factors": {
      "lighting": 8.5,
      "crime_risk": 1.2,
      "accident_risk": 2.0,
      "crowd_level": 7.5
    },
    "createdAt": "2026-10-15T00:41:40.123Z"
  }
}
```
- **Error `403 Forbidden`**: Caller does not own this prediction.
- **Error `404 Not Found`**: Prediction ID does not exist.

---

### 2.4 User Profile Area (`/api/users`)

#### `GET /api/users/me`
Retrieves comprehensive profile information for the authenticated user.

- **Auth Required**: `Bearer <accessToken>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "67a91fcb4e311002b80a1122",
    "name": "Jane Commuter",
    "email": "jane@example.com",
    "role": "user",
    "isVerified": true,
    "emergencyContact": "+1 (555) 234-5678",
    "defaultPreset": "night",
    "createdAt": "2026-10-15T00:20:00.000Z",
    "updatedAt": "2026-10-15T00:40:00.000Z"
  }
}
```

#### `PATCH /api/users/me`
Updates user profile settings and allows secure password changes.

- **Auth Required**: `Bearer <accessToken>`
- **Request Body (Profile Update)**:
```json
{
  "name": "Jane Commuter Updated",
  "emergencyContact": "+1 (555) 999-0000",
  "defaultPreset": "maximum"
}
```
- **Request Body (Password Change)**:
```json
{
  "currentPassword": "Password@123",
  "newPassword": "NewPassword@456",
  "confirmPassword": "NewPassword@456"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "User profile updated successfully.",
  "data": {
    "id": "67a91fcb4e311002b80a1122",
    "name": "Jane Commuter Updated",
    "email": "jane@example.com",
    "role": "user",
    "isVerified": true,
    "emergencyContact": "+1 (555) 999-0000",
    "defaultPreset": "maximum",
    "updatedAt": "2026-10-15T00:42:00.000Z"
  }
}
```
- **Error `400 Bad Request`**: Incorrect `currentPassword` or mismatched confirmation.

---

### 2.5 Administration Area (`/api/admin`)

All administration endpoints require `Authorization: Bearer <accessToken>` where `user.role === 'admin'`. Non-admins receive `403 Forbidden`.

#### `GET /api/admin/stats`
Retrieves live operational metrics across database, AI microservice, and user accounts.

- **Auth Required**: `Bearer <adminAccessToken>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 48,
      "verifiedUsers": 45,
      "unverifiedUsers": 3,
      "adminUsers": 2,
      "totalPredictions": 134,
      "totalRoutes": 89
    },
    "services": {
      "database": {
        "status": "connected",
        "pingLatencyMs": 1.2
      },
      "aiMicroservice": {
        "status": "online",
        "modelLoaded": true,
        "latencyMs": 4.1
      },
      "backend": {
        "status": "healthy",
        "uptime": 3600.4,
        "memory": {
          "heapUsed": "48 MB"
        }
      }
    }
  }
}
```

#### `GET /api/admin/users`
Paginated user directory with search and role filtering.

- **Auth Required**: `Bearer <adminAccessToken>`
- **Query Parameters**:
  - `page` (integer, default `1`)
  - `limit` (integer, default `10`)
  - `search` (string, searches name and email)
  - `role` (enum: `user` | `admin`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "67a91fcb4e311002b80a1122",
      "name": "Jane Commuter",
      "email": "jane@example.com",
      "role": "user",
      "isVerified": true,
      "emergencyContact": "+1 (555) 234-5678",
      "lastLogin": "2026-10-15T00:30:00.000Z",
      "createdAt": "2026-10-15T00:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalRecords": 48,
    "totalPages": 5
  }
}
```

#### `PATCH /api/admin/users/:id/role`
Updates a user's authorization role (`user` or `admin`). Writes to immutable audit log.

- **Auth Required**: `Bearer <adminAccessToken>`
- **Request Body**:
```json
{
  "role": "admin"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "User role updated successfully.",
  "data": {
    "id": "67a91fcb4e311002b80a1122",
    "email": "jane@example.com",
    "role": "admin"
  }
}
```

#### `DELETE /api/admin/users/:id`
Deletes a user account. Prevents admins from deleting their own account. Writes to immutable audit log.

- **Auth Required**: `Bearer <adminAccessToken>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "User deleted successfully."
}
```
- **Error `400 Bad Request`**: `{"message": "Admins cannot delete their own account."}`

#### `GET /api/admin/audit-logs`
Retrieves paginated administrative audit trail with sanitized metadata.

- **Auth Required**: `Bearer <adminAccessToken>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "67a922338b0a1200fa445566",
      "action": "ADMIN_UPDATE_ROLE",
      "adminId": "67a900112233445566778899",
      "targetUserId": "67a91fcb4e311002b80a1122",
      "metadata": {
        "newRole": "admin"
      },
      "ip": "127.0.0.1",
      "timestamp": "2026-10-15T00:42:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 1
  }
}
```

---

## 3. Centralized Error Handling Standards

All unhandled exceptions, validation errors, and operational rejections flow through the centralized `errorHandler` middleware.

### Standard Error JSON Shape
```json
{
  "success": false,
  "message": "Human-readable explanation of error",
  "code": "MACHINE_READABLE_CODE",
  "errors": {
    "field": "Specific field validation message"
  }
}
```

| HTTP Status | Machine Code | Cause |
|:---|:---|:---|
| `400 Bad Request` | `VALIDATION_ERROR` | Request body or query parameters failed Zod schema checks. |
| `401 Unauthorized` | `UNAUTHORIZED` | Missing, malformed, or expired JWT access token. |
| `403 Forbidden` | `FORBIDDEN` | Caller lacks required role or ownership permissions. |
| `404 Not Found` | `NOT_FOUND` | Requested route segment or database record does not exist. |
| `409 Conflict` | `DUPLICATE_KEY` | Unique constraint violated (e.g. duplicate email address). |
| `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED` | Rate limit window exceeded. |
| `500 Server Error` | `INTERNAL_SERVER_ERROR` | Unhandled runtime exception (stack trace hidden in production). |
| `503 Unavailable` | `SERVICE_UNAVAILABLE` | Database or upstream AI service connection timeout. |

---

## 4. Verification and Test Execution Results

All 63 automated tests pass cleanly across 14 test suites:
```bash
$ npm test
ℹ tests 63
ℹ suites 14
ℹ pass 63
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 11262.53
```
- `src/tests/auth.test.ts`: Password hashing, OTP generation, token rotation, family revocation.
- `src/tests/admin.test.ts`: Role-based route guard, user administration, telemetry probes.
- `src/tests/database.test.ts`: MongoDB schema validation, unique indexes, secret scrubbing.
- `src/tests/api.test.ts`: Health endpoints, route prediction, ownership validation, profile updates.
- `src/tests/e2e.test.ts`: Complete end-to-end authentication lifecycle (registration -> verification -> login -> session refresh -> password reset -> logout).
