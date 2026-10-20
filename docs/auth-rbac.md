# SafeRoute Authentication & Role-Based Access Control (RBAC) Specification

**System**: SafeRoute — AI-Powered Safety-Aware Route Recommendation System  
**Version**: 1.0.0 (Production Architecture)  
**Security Model**: JWT Access Token (15 min) + HttpOnly Refresh Token (7 days) with Refresh Token Rotation (RTR)  
**Access Model**: Multi-Tier Role-Based Access Control (`user`, `admin`) + Resource Ownership Verification  

---

## 1. Security Architecture & Threat Model

SafeRoute implements a Defense-in-Depth security architecture designed to prevent credential theft, token hijacking, unauthorized data access, privilege escalation, and brute-force attacks.

```
                           +-----------------------------------------------+
                           |        Client Browser (React / Vite)          |
                           +-----------------------------------------------+
                                    |                           |
                       Authorization: Bearer <JWT>     Cookie: refreshToken (HttpOnly)
                                    |                           |
                                    v                           v
+------------------------------------------------------------------------------------------+
| Express API Gateway / Reverse Proxy (Helmet, CORS, RateLimiter, RequestTimeout)          |
+------------------------------------------------------------------------------------------+
  |                                 |                             |
  v                                 v                             v
[Public Endpoints]          [Protected Endpoints]        [Administrative Endpoints]
- /api/auth/register        - /api/users/me              - /api/admin/stats
- /api/auth/login           - /api/safety/history        - /api/admin/users
- /api/auth/verify-otp      - /api/routes/history        - /api/admin/audit-logs
- /health                   [Middleware: requireAuth]    [Middleware: requireAdmin / requireRole]
                                    |                             |
                                    +--------------+--------------+
                                                   |
                                                   v
                                  [Resource Ownership Verification]
                               (p.user.toString() === req.user.userId)
                                                   |
                                                   v
                                   [Mongoose Persistent Storage]
                                      (MongoDB / MemoryStore)
```

---

## 2. Backend Security Implementation

### 2.1 Password Hashing & Salt Strategy
- **Library**: `bcryptjs` with work factor 12 (`await bcrypt.genSalt(12)`).
- **Pre-Save Lifecycle**: The Mongoose `UserSchema` applies a pre-save hook that automatically hashes candidate passwords upon registration or modification.
- **Serialization Safety**: The `password` field in `UserSchema` is explicitly defined with `select: false`. The schema overrides `toJSON()` and `toObject()` to unconditionally strip `password` hashes and sensitive metadata before outputting JSON.

### 2.2 Registration & Untrusted Input Sanitization
- **Email Normalization**: Emails are automatically trimmed, converted to lowercase, and validated against RFC 5322 regex via Zod (`authValidators.ts`) and Mongoose schema indexes.
- **Duplicate Prevention**: The backend queries for existing verified accounts and returns `409 Conflict` (`An account with this email address already exists. Please log in.`).
- **Untrusted Role Stripping**: Client requests submitting `role: 'admin'` are strictly ignored. The registration endpoint only binds `{ name, email, password }` and forces `role: 'user'` by default.

### 2.3 Credential Verification & Two-Factor OTP
- Passwords are verified using `user.comparePassword(candidatePassword)` (constant-time comparison).
- Accounts require email verification via a 6-digit numeric OTP with a 10-minute TTL.
- OTPs are stored exclusively as SHA-256 cryptographic digests in the `Otp` collection; plaintext codes are never persisted.
- Brute-force protection limits verification attempts to 5 before the OTP record is purged.

### 2.4 Token Management & Refresh Token Rotation (RTR)
- **Access Tokens**: Short-lived (15 minutes), signed with `ENV.JWT.ACCESS_SECRET` (HS256). Contains `{ userId, role }`.
- **Refresh Tokens**: Long-lived (7 days), high-entropy 40-byte random string (`generateRandomToken(40)`). Stored in MongoDB as SHA-256 digests (`tokenHash`) with an associated `family` ID.
- **Delivery**: Refresh tokens are delivered via `httpOnly`, `secure`, `sameSite: strict/lax` cookies, immune to client-side XSS extraction.
- **Replay Detection & Family Invalidation**: When an already-revoked refresh token is presented, the system detects a token reuse/compromise event, logs a security warning, and invalidates all tokens in that `family` immediately.

### 2.5 Role-Based Access Control (RBAC) & Ownership Guards
- **`requireAuth`**: Validates the Bearer token in the `Authorization` header. If absent or invalid, returns `401 Unauthorized` with structured error codes (`TOKEN_EXPIRED`).
- **`requireAdmin` / `requireRole(...roles)`**: Verifies that `req.user.role === 'admin'`. If a regular user attempts an admin action, the gateway halts execution and returns `403 Forbidden` (`Access denied. Administrator privileges required.`).
- **Resource Ownership Guards**:
  - `GET /api/safety/history`: Automatically scopes queries to `{ user: req.user.userId }` unless the caller is an administrator requesting audit telemetry.
  - `GET /api/safety/history/:id`: Rejects non-owners with `403 Forbidden` (`Access denied: You do not own this prediction audit record.`).
  - `GET /api/users/me` & `PATCH /api/users/me`: Strictly operates on `req.user.userId`.
  - `DELETE /api/admin/users/:id`: Prevents administrators from deleting their own active accounts.

---

## 3. Frontend Authentication & RBAC Integration

### 3.1 State Management & Silent Refresh (`AuthContext.tsx`)
- On application mount, `AuthContext` executes a silent session restore by calling `POST /api/auth/refresh` via the browser's HttpOnly cookie.
- If valid, the new short-lived access token is loaded into memory, and the profile is fetched via `GET /api/auth/me`.
- If expired or absent, the state cleanly resets to unauthenticated without user disruption.

### 3.2 Dynamic Route Guards (`App.tsx`)
Route synchronization handles clearance enforcement:
| Route | Guest / Unauthenticated | Standard User (`user`) | Administrator (`admin`) |
|:---|:---|:---|:---|
| `/` or `#/landing` | Public Landing Page | Public Landing Page | Public Landing Page |
| `#/login` | Login / Register Page | Redirected to `#/app` | Redirected to `#/admin` |
| `#/app` | Redirected to `#/login` | Traveler Dashboard | Traveler Dashboard |
| `#/routes` | Redirected to `#/login` | Route Planner & Prediction | Route Planner & Prediction |
| `#/prediction-details`| Redirected to `#/login` | Own Prediction Audit | Any Prediction Audit |
| `#/profile` | Redirected to `#/login` | Own Account & Preferences | Own Account & Preferences |
| `#/admin` | Redirected to `#/login` | **Redirected to `#/unauthorized` (403)** | **Admin Console & Telemetry** |

### 3.3 Connected Pages
- **Login & Registration (`LoginPage.tsx`, `AuthModal.tsx`)**: Form validation, error toast dispatches, and automatic transition to OTP verification.
- **Profile Management (`ProfilePage.tsx`)**: Connected directly to `GET /api/users/me` and `PATCH /api/users/me`. Supports live preference saving and password updates requiring current password verification.
- **Admin Management (`AdminDashboard.tsx`)**: Connected to `fetchAdminStats()`, `fetchAdminUsers()`, `updateAdminUserRole()`, and `deleteAdminUser()`. Displays live server telemetry and user directory.
- **Safe Logout (`handleLogout`)**: Dispatches `POST /api/auth/logout`, clears the HttpOnly cookie, resets in-memory auth state, and redirects to `#/login`.

---

## 4. Secure Administrator Bootstrap Process

To satisfy the zero-hardcoded-credentials requirement, a dedicated CLI bootstrap tool is provided:

### Script Location
[`backend/src/scripts/bootstrapAdmin.ts`](file:///c:/Users/shraw/OneDrive/Desktop/SafeRoute/backend/src/scripts/bootstrapAdmin.ts)

### Execution Command
```bash
cd backend
npm run admin:bootstrap
```

### Options & Environment Configuration
```bash
# Example 1: Interactive / Environment-driven execution
BOOTSTRAP_ADMIN_EMAIL=security@saferoute.com \
BOOTSTRAP_ADMIN_PASSWORD='SecureAdminPassword#2026!' \
BOOTSTRAP_ADMIN_NAME='Lead Security Admin' \
npm run admin:bootstrap

# Example 2: CLI argument flags
npx tsx src/scripts/bootstrapAdmin.ts --email=admin@saferoute.com --password='CustomPassword@123' --force
```

### Security Properties of the Bootstrap Process:
1. **Accidental Overwrite Protection**: If an active administrator account already exists, the script halts without modifying records unless the `--force` flag is provided.
2. **High-Entropy Password Generation**: If no password is provided in CLI arguments or environment variables, the script generates a one-time 24-character cryptographically secure password (`Adm!n#<random-hex>9A`) and outputs it once to stdout.
3. **Password Policy Enforcement**: Validates that candidate administrator passwords satisfy complexity rules (minimum 8 characters, uppercase, lowercase, digit, and special symbol).
4. **Sanitized Audit Record**: Records the provisioning event to `AuditLog` (`action: ADMIN_BOOTSTRAP`) with metadata strictly sanitized of all secrets or passwords.
5. **No Credential Logging**: Passwords and password hashes are never written to disk, server logs, or telemetry outputs.

---

## 5. Test Verification Matrix

All 70 automated tests across 14 test suites pass with zero failures:

```bash
$ npm test
ℹ tests 70
ℹ suites 14
ℹ pass 70
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 13221.84
```

| Security Test Case | Suite | Verification Result |
|:---|:---|:---|
| **Successful registration** | `src/tests/api.test.ts` | Pass (`201 Created`, user created in pending state, OTP dispatched) |
| **Duplicate registration rejection** | `src/tests/api.test.ts` | Pass (`409 Conflict`, message confirms existing account) |
| **Untrusted role stripping** | `src/tests/api.test.ts` | Pass (Client-supplied `role: admin` rejected; role remains `user`) |
| **Successful login** | `src/tests/api.test.ts` | Pass (`200 OK`, returns JWT accessToken, sets HttpOnly refreshToken) |
| **Invalid credentials rejection** | `src/tests/api.test.ts` | Pass (`401 Unauthorized`, `Invalid email or password.`) |
| **Access without token** | `src/tests/api.test.ts` | Pass (`401 Unauthorized`, `Authentication required. No token provided.`) |
| **Invalid / forged token rejection** | `src/tests/api.test.ts` | Pass (`401 Unauthorized`, `TOKEN_EXPIRED`) |
| **Normal user attempting admin routes** | `src/tests/api.test.ts` | Pass (`403 Forbidden` on `/api/admin/stats` and `/api/admin/users`) |
| **Admin accessing authorized routes** | `src/tests/api.test.ts` | Pass (`200 OK` on `/api/admin/stats` and `/api/admin/users`) |
| **User accessing another's records** | `src/tests/api.test.ts` | Pass (`403 Forbidden` on `/api/safety/history/:id` for non-owners) |
| **Replay / Revoked token detection** | `src/tests/e2e.test.ts` | Pass (`401 Unauthorized`, invalidates entire family) |
| **Session behavior after logout** | `src/tests/api.test.ts` | Pass (`401 Unauthorized` on `/api/auth/refresh` after logout) |
| **Password sanitization in serialization** | `src/tests/database.test.ts`| Pass (`password` undefined in `.toJSON()` and API responses) |
| **Audit log secret scrubber** | `src/tests/database.test.ts`| Pass (Redacts passwords, tokens, OTPs, and keys) |

---

## 6. Known Limitations & Production Recommendations

1. **Local Development Database Fallback**:
   - In development mode without a running MongoDB daemon, the system falls back to an in-memory storage layer to enable offline testing.
   - For persistent multi-container production deployments, ensure `NODE_ENV=production` and configure a persistent cluster via `MONGO_URI`.
2. **Reverse Proxy & HTTPS**:
   - In production environments behind cloud reverse proxies (e.g., NGINX, Cloudflare, AWS ALB), set `app.set('trust proxy', 1)` in Express and ensure SSL termination so cookies are marked `secure: true`.
3. **JWT Secret Entropy**:
   - Ensure `JWT_ACCESS_SECRET` in `.env` is a high-entropy string (at least 64 random alphanumeric characters).
