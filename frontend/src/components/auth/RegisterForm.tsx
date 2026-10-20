import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Send,
  ShieldCheck,
  RefreshCw,
  KeyRound,
} from 'lucide-react';

export const RegisterForm: React.FC = () => {
  const { sendOtp, verifyOtp, register, setAuthModalView } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification States
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  // Form submission and alert states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // If user edits email after verification or sending OTP, invalidate verification session
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (verifiedEmail && val.trim().toLowerCase() !== verifiedEmail.toLowerCase()) {
      setVerifiedEmail(null);
      setVerificationToken(null);
      setOtp('');
      setOtpSent(false);
      setOtpMessage({
        type: 'info',
        text: 'Email address modified. Please verify this email address before creating your account.',
      });
    }
  };

  // Email format validation
  const isValidEmail = (addr: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr.trim());

  // Password strength calculations
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const criteriaMet = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLevel =
    password.length === 0 ? 0 : criteriaMet <= 2 ? 1 : criteriaMet <= 3 ? 2 : criteriaMet <= 4 ? 3 : 4;

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#0d9488'];

  const isEmailVerified = Boolean(
    verifiedEmail &&
    verificationToken &&
    email.trim().toLowerCase() === verifiedEmail.toLowerCase()
  );

  const isFormValid =
    name.trim().length >= 2 &&
    isEmailVerified &&
    criteriaMet === 5 &&
    password === confirmPassword &&
    !isSubmitting;

  // 1. Send Verification OTP
  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    setError(null);
    setOtpMessage(null);
    setIsSendingOtp(true);

    try {
      const res = await sendOtp(trimmedEmail, 'EMAIL_VERIFICATION');
      setOtpSent(true);
      setCooldown(60);
      const devCode = (res as any)?.devOtp || (res as any)?.otp;
      if (devCode) {
        setOtp(devCode);
        setOtpMessage({
          type: 'success',
          text: `Verification code sent! (Code: ${devCode})`,
        });
      } else {
        setOtpMessage({
          type: 'success',
          text: res.message || 'Verification code sent. Please check your inbox and spam folder.',
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please check your email configuration.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6 || !/^\d+$/.test(trimmedOtp)) {
      setOtpMessage({
        type: 'error',
        text: 'Please enter the 6-digit numeric verification code.',
      });
      return;
    }

    setError(null);
    setOtpMessage(null);
    setIsVerifyingOtp(true);

    try {
      const res = await verifyOtp({
        email: email.trim(),
        otp: trimmedOtp,
        purpose: 'EMAIL_VERIFICATION',
      });

      if (res.verificationToken) {
        setVerificationToken(res.verificationToken);
        setVerifiedEmail(email.trim());
        setOtpMessage({
          type: 'success',
          text: '✓ Email verified successfully! You may now complete your registration.',
        });
      } else {
        setOtpMessage({
          type: 'error',
          text: res.message || 'Verification could not be confirmed.',
        });
      }
    } catch (err: any) {
      setOtpMessage({
        type: 'error',
        text: err?.message || 'Invalid or expired code. Please try again.',
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 3. Complete Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailVerified || !verificationToken) {
      setError('Please verify your email address before creating an account.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (criteriaMet < 5) {
      setError('Password must be at least 8 characters with upper, lower, number, and special character.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        verificationToken,
      });
      setSuccess('Account created successfully! Welcome to SafeRoute.');
    } catch (err: any) {
      setError(err?.message || 'Account registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-header">
        <h3>Create Your Account</h3>
        <p>Verify your email and set up your SafeRoute profile to unlock real-time safety navigation.</p>
      </div>

      {/* Main Error Alert */}
      {error && (
        <div className="auth-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Success Alert */}
      {success && (
        <div className="auth-alert success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Full Name */}
      <div className="form-group">
        <label htmlFor="register-name">Full Name</label>
        <div className="input-wrapper">
          <User className="input-icon" size={18} />
          <input
            id="register-name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            autoComplete="name"
            required
          />
        </div>
      </div>

      {/* Email Address with Inline Send Verification OTP Button */}
      <div className="form-group">
        <div className="label-row">
          <label htmlFor="register-email">Email Address</label>
          {isEmailVerified && (
            <span className="verified-pill">
              <CheckCircle2 size={12} />
              Verified
            </span>
          )}
        </div>

        <div className="email-action-row">
          <div className="input-wrapper">
            <Mail className="input-icon" size={18} />
            <input
              id="register-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={isSubmitting || (isEmailVerified && !isSendingOtp)}
              autoComplete="email"
              required
            />
          </div>

          <button
            type="button"
            className="send-otp-btn"
            onClick={handleSendOtp}
            disabled={
              isSendingOtp ||
              cooldown > 0 ||
              !isValidEmail(email) ||
              isSubmitting ||
              (isEmailVerified && email.trim().toLowerCase() === verifiedEmail?.toLowerCase())
            }
            title={
              cooldown > 0
                ? `Please wait ${cooldown}s before resending`
                : 'Send verification code to this email'
            }
          >
            {isSendingOtp ? (
              <>
                <Loader2 size={14} className="spinner" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              <>
                <RefreshCw size={14} className="spinner" />
                Resend ({cooldown}s)
              </>
            ) : isEmailVerified ? (
              <>
                <ShieldCheck size={14} />
                Verified
              </>
            ) : (
              <>
                <Send size={14} />
                Send OTP
              </>
            )}
          </button>
        </div>
      </div>

      {/* OTP Verification Box (Appears when OTP is sent or if not yet verified) */}
      {(otpSent || isEmailVerified) && (
        <div className="otp-box-section">
          <div className="label-row">
            <label htmlFor="register-otp" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
              6-Digit Verification Code
            </label>
            {cooldown > 0 && (
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Resend available in <strong style={{ color: '#0d9488' }}>{cooldown}s</strong>
              </span>
            )}
          </div>

          {!isEmailVerified ? (
            <>
              <div className="otp-inline-row">
              <input
                id="register-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                className="otp-input-field"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isVerifyingOtp || isSubmitting}
                autoComplete="one-time-code"
              />
              <button
                type="button"
                className="verify-otp-btn"
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || isVerifyingOtp || isSubmitting}
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 size={14} className="spinner" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <KeyRound size={14} />
                    Verify OTP
                  </>
                )}
              </button>
            </div>
            {otp.length > 0 && otp.length < 6 && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#b45309' }}>
                Please enter all 6 digits ({otp.length}/6 entered)
              </p>
            )}
          </>
          ) : (
            <div className="auth-alert success" style={{ margin: 0, padding: '8px 12px' }}>
              <CheckCircle2 size={16} />
              <span>Email confirmed! Enter your password below to create your account.</span>
            </div>
          )}

          {/* OTP Feedback Notification */}
          {otpMessage && (
            <div className={`auth-alert ${otpMessage.type}`} style={{ margin: 0, padding: '8px 12px', fontSize: '12px' }}>
              {otpMessage.type === 'success' ? (
                <CheckCircle2 size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
              <span>{otpMessage.text}</span>
            </div>
          )}
        </div>
      )}

      {/* Password Field */}
      <div className="form-group">
        <label htmlFor="register-password">Password</label>
        <div className="input-wrapper">
          <Lock className="input-icon" size={18} />
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 chars with uppercase, number & symbol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Live Password Strength Meter */}
        {password.length > 0 && (
          <div className="password-strength-container">
            <div className="strength-bar-track">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className="strength-step"
                  style={{
                    backgroundColor: step <= strengthLevel ? strengthColors[strengthLevel] : '#e2e8f0',
                  }}
                />
              ))}
            </div>
            <div className="strength-label" style={{ color: strengthColors[strengthLevel] }}>
              Strength: {strengthLabels[strengthLevel]}
              {criteriaMet < 5 && (
                <span style={{ color: '#64748b', fontWeight: 'normal', marginLeft: '6px' }}>
                  ({criteriaMet}/5 rules)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="form-group">
        <label htmlFor="register-confirm-password">Confirm Password</label>
        <div className="input-wrapper">
          <Lock className="input-icon" size={18} />
          <input
            id="register-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            tabIndex={-1}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {confirmPassword && confirmPassword === password && (
            <CheckCircle2 size={18} className="match-icon" style={{ right: '40px' }} />
          )}
        </div>
      </div>

      {/* Create Account Submit Button - ONLY enabled after email verification & valid form */}
      <button
        type="submit"
        className="auth-submit-btn"
        disabled={!isFormValid}
        title={
          !isEmailVerified
            ? 'Please verify your email with the OTP before creating an account'
            : !isFormValid
            ? 'Please complete all required fields and ensure passwords match'
            : 'Create SafeRoute Account'
        }
      >
        {isSubmitting ? (
          <>
            <Loader2 className="spinner" size={18} />
            Creating Account...
          </>
        ) : (
          <>
            Create Account
            <ArrowRight size={18} />
          </>
        )}
      </button>

      {/* Switch to Login Link */}
      <div className="auth-switch-footer">
        Already have an account?{' '}
        <button
          type="button"
          className="switch-link"
          onClick={() => setAuthModalView('login')}
        >
          Sign In
        </button>
      </div>
    </form>
  );
};
