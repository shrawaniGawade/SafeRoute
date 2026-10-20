# ISSUE-03: User Registration and OTP Verification

| Field | Value |
|---|---|
| **Phase / Day** | Phase 2 · Day 2 |
| **Priority** | Must have |
| **Labels** | `auth`, `frontend`, `backend` |
| **Status** | ✅ Done |
| **Depends on** | ISSUE-01 |
| **Requirements** | FR-1.1 – FR-1.3, FR-1.6 · FRD F1.1, F1.2 |

## What is this?
New users create an account with their name, email, and password. A 6-digit code (OTP) is sent to their email to confirm it belongs to them. This stops fake accounts and lets the user save routes later.

## User Story
**As a** new visitor,
**I want** to create an account and verify my email,
**so that** I can save my routes and preferences.

## Workflow
1. The user clicks **Sign up**.
2. The user enters name, email, password, and confirm password.
3. The app shows how strong the password is.
4. The user clicks **Create account**, and the backend saves the user as "not verified".
5. A 6-digit code is emailed to the user.
6. The user types the code, the account is verified, and the user is logged in automatically.
7. If the code didn't arrive, the user clicks **Resend** (available after 60 seconds).

## Tasks
- [x] User model with `isVerified` and a hashed password (bcrypt)
- [x] OTP model with a hashed code, attempt count, and expiry (TTL index)
- [x] `POST /api/auth/register` with Zod validation
- [x] `POST /api/auth/verify-otp` (maximum 5 attempts)
- [x] `POST /api/auth/resend-otp` (60-second cooldown)
- [x] Email service (Nodemailer)
- [x] Frontend: `RegisterForm`, `OtpForm`, password-strength meter
- [x] Tests for register and duplicate email

## Acceptance Criteria
- [x] **Given** valid details, **when** I register, **then** an OTP email is sent and the OTP screen opens.
- [x] **Given** an email that already exists, **when** I register, **then** I see a generic error and no new account is created.
- [x] **Given** the wrong OTP 5 times, **then** the code is locked and I must request a new one.
- [x] **Given** the correct OTP, **then** my account is verified and I am logged in.

## Technical Notes
- **Files:** `authController.ts`, `models/User.ts`, `models/Otp.ts`, `components/auth/RegisterForm.tsx`, `OtpForm.tsx`
- **Security:** rate limit on register and OTP; passwords and OTPs are never stored as plain text
