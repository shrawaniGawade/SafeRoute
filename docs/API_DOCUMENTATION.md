# SafeRoute - API Documentation

Base URL: `/api`

All API requests accepting a JSON payload must include the `Content-Type: application/json` header.
Protected endpoints require `Authorization: Bearer <accessToken>`.

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register User
- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Rate Limit**: 15 requests / 15 mins
- **Description**: Registers a new unverified user and dispatches a 6-digit verification code. If an account already exists with `isVerified: false`, updates the information and issues a fresh code.
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123"
}
```
- **Response `201 Created`**:
```json
{
  "message": "Registration initiated! Please enter the 6-digit verification code sent to your email.",
  "email": "jane@example.com"
}
```
- **Error `409 Conflict`**: Email already registered and verified.
- **Error `400 Bad Request`**: Validation failure (weak password, mismatched confirmation, invalid email).

---

### 1.2 Verify OTP
- **Method**: `POST`
- **URL**: `/api/auth/verify-otp`
- **Rate Limit**: 6 requests / 15 mins
- **Description**: Validates the 6-digit numeric OTP code. When `purpose` is `EMAIL_VERIFICATION`, marks account verified, creates tokens, sets `httpOnly` refresh cookie, and logs in user.
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "otp": "492810",
  "purpose": "EMAIL_VERIFICATION" // or "PASSWORD_RESET"
}
```
- **Response `200 OK` (for EMAIL_VERIFICATION)**:
```json
{
  "message": "Account verified successfully!",
  "user": {
    "id": "67a91...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "isVerified": true
  },
  "accessToken": "eyJhbGciOi..."
}
```
- **Sets Cookie**: `refreshToken=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
- **Error `400 Bad Request`**: Incorrect code (returns remaining attempts), or maximum 5 attempts exceeded.

---

### 1.3 Resend OTP
- **Method**: `POST`
- **URL**: `/api/auth/resend-otp`
- **Rate Limit**: 6 requests / 15 mins
- **Description**: Generates a fresh 6-digit code with 10-minute expiry. Enforces a 60-second cooldown from the previous code generation.
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "purpose": "EMAIL_VERIFICATION" // or "PASSWORD_RESET"
}
```
- **Response `200 OK`**:
```json
{
  "message": "A new verification code has been dispatched to your email."
}
```
- **Error `429 Too Many Requests`**: Triggered if requested within the 60-second cooldown window.

---

### 1.4 Login
- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Rate Limit**: 15 requests / 15 mins
- **Description**: Authenticates user credentials. Returns short-lived access token and sets long-lived `httpOnly` refresh token cookie.
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
    "id": "67a91...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "isVerified": true
  },
  "accessToken": "eyJhbGciOi..."
}
```
- **Error `401 Unauthorized`**: Invalid email or password.
- **Error `403 Forbidden`**: Account email not yet verified. Automatically sends fresh OTP and flags `unverified: true`.

---

### 1.5 Refresh Token (Silent Restore & RTR)
- **Method**: `POST`
- **URL**: `/api/auth/refresh-token`
- **Description**: Rotates the session refresh token. Reads the `refreshToken` cookie, invalidates old token, creates a new pair, and sets the updated cookie.
- **Cookie Required**: `refreshToken=<token>`
- **Response `200 OK`**:
```json
{
  "accessToken": "eyJhbGciOi..."
}
```
- **Error `401 Unauthorized`**: Cookie missing, expired, or token reuse detected (all sessions revoked).

---

### 1.6 Forgot Password
- **Method**: `POST`
- **URL**: `/api/auth/forgot-password`
- **Rate Limit**: 6 requests / 15 mins
- **Description**: Requests password recovery code. Implements anti-enumeration: always returns identical success message whether the email exists or not.
- **Request Body**:
```json
{
  "email": "jane@example.com"
}
```
- **Response `200 OK`**:
```json
{
  "message": "If an account exists with this email address, a password reset code has been sent."
}
```

---

### 1.7 Reset Password
- **Method**: `POST`
- **URL**: `/api/auth/reset-password`
- **Rate Limit**: 6 requests / 15 mins
- **Description**: Validates the 6-digit OTP code, sets the new password, and invalidates all existing sessions/refresh tokens across all devices.
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "otp": "492810",
  "newPassword": "NewPassword@999",
  "confirmNewPassword": "NewPassword@999"
}
```
- **Response `200 OK`**:
```json
{
  "message": "Your password has been reset successfully. Please log in with your new password."
}
```

---

### 1.8 Logout
- **Method**: `POST`
- **URL**: `/api/auth/logout`
- **Description**: Invalidation of current refresh token in MongoDB and clears the client `httpOnly` cookie.
- **Response `200 OK`**:
```json
{
  "message": "Logged out successfully."
}
```

---

### 1.9 Get Current Profile
- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Retrieves authenticated user details.
- **Response `200 OK`**:
```json
{
  "user": {
    "id": "67a91...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "isVerified": true,
    "lastLogin": "2026-10-10T12:00:00.000Z",
    "createdAt": "2026-10-10T11:55:00.000Z"
  }
}
```
- **Error `401 Unauthorized`**: Token missing, expired, or malformed.

---

## 2. Safety Prediction Endpoints (`/api/safety`)

### 2.1 Predict Route Safety
- **Method**: `POST`
- **URL**: `/api/safety/predict`
- **Description**: Proxies safety features to the Python AI microservice model and computes safety score.
- **Request Body**:
```json
{
  "lighting": 8,
  "crime_risk": 2,
  "accident_risk": 3,
  "crowd_level": 7
}
```
- **Response `200 OK`**:
```json
{
  "safety_score": 84.5,
  "model": "Random Forest",
  "data_type": "demonstration",
  "warning": "Demo model: do not rely on this score for life-critical decisions."
}
```

---

### 3.1 Health Check
- **Method**: `GET`
- **URL**: `/api/health`
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "message": "SafeRoute backend is running",
  "timestamp": "2026-10-10T12:05:00.000Z"
}
```

---

## 4. Admin Management Endpoints (`/api/admin`)

All `/api/admin` routes strictly require `Authorization: Bearer <accessToken>` of a user with `role: "admin"`.

### 4.1 System Telemetry & Statistics
- **Method**: `GET`
- **URL**: `/api/admin/stats`
- **Description**: Returns live system telemetry, RAM utilization, microservice status, active user counts, and user list.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "server": {
      "uptimeSeconds": 1824,
      "nodeVersion": "v20.x",
      "environment": "development",
      "memoryUsageMb": 42
    },
    "services": {
      "backend": { "status": "ONLINE", "port": 5000, "latencyMs": 2 },
      "aiScoringEngine": { "status": "ONLINE", "endpoint": "http://127.0.0.1:8000", "latencyMs": 14 },
      "database": { "status": "ONLINE", "engine": "Dual-Layer In-Memory / MongoDB" },
      "emailGateway": { "status": "ONLINE", "provider": "Ethereal Mail (Dev)" }
    },
    "stats": {
      "totalUsers": 3,
      "verifiedUsers": 3,
      "adminUsers": 1,
      "verificationRate": 100
    },
    "users": [
      {
        "id": "67a91...",
        "name": "SafeRoute Admin",
        "email": "admin@saferoute.com",
        "role": "admin",
        "isVerified": true
      }
    ]
  }
}
```
- **Error `401 Unauthorized`**: No token provided.
- **Error `403 Forbidden`**: Token user role is not `admin`.

---

### 4.2 Toggle User Role (Promote / Demote)
- **Method**: `PATCH`
- **URL**: `/api/admin/users/:id/role`
- **Description**: Promotes a user to `admin` or demotes to `user`.
- **Request Body**:
```json
{
  "role": "admin" // or "user"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "User traveler@saferoute.com role updated to admin.",
  "user": {
    "id": "67a91...",
    "name": "Traveler",
    "email": "traveler@saferoute.com",
    "role": "admin"
  }
}
```
- **Error `400 Bad Request`**: Attempting to demote your own account.

---

### 4.3 Delete User Account
- **Method**: `DELETE`
- **URL**: `/api/admin/users/:id`
- **Description**: Permanently removes a user record from the database.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "User account traveler@saferoute.com was removed."
}
```
- **Error `400 Bad Request`**: Attempting to delete your own account.

