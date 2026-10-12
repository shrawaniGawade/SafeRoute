# ISSUE-05: Forgot and Reset Password

| Field | Value |
|---|---|
| **Phase / Day** | Phase 2 · Day 2 |
| **Priority** | Should have |
| **Labels** | `auth`, `security` |
| **Status** | ✅ Done |
| **Depends on** | ISSUE-03, ISSUE-04 |
| **Requirements** | FR-1.7 · FRD F1.5 |

## What is this?
If a user forgets their password, they can reset it with a code sent to their email. The app always shows the same message, whether or not the email exists, so nobody can use this screen to find out who has an account.

## User Story
**As a** user who forgot my password,
**I want** to reset it using my email,
**so that** I can get back into my account.

## Workflow
1. The user clicks **Forgot password?** on the login screen.
2. The user enters their email and sees: "If this email exists, a code has been sent."
3. The user enters the code and a new password.
4. The password is changed, and all old sessions are logged out.
5. The user logs in with the new password.

## Tasks
- [x] `POST /api/auth/forgot-password` (same response for every email)
- [x] `POST /api/auth/reset-password` (OTP + new password)
- [x] Revoke all refresh tokens after a reset
- [x] Frontend `ForgotPasswordForm` and `ResetPasswordForm`
- [x] Rate limit both endpoints

## Acceptance Criteria
- [x] **Given** any email, **when** I request a reset, **then** I see the same success message.
- [x] **Given** a valid code and a strong password, **when** I reset, **then** I can log in with the new password.
- [x] **Given** an expired or wrong code, **then** I see a clear error.
- [x] **Given** a reset is done, **then** my old sessions no longer work.

## Technical Notes
- **Files:** `authController.ts`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`
- The new password follows the same rules as registration
