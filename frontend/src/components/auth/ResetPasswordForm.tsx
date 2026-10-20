import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, ArrowRight, AlertCircle, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

export const ResetPasswordForm: React.FC = () => {
  const { pendingOtpEmail, pendingResetOtp, resetPassword, setAuthModalView } = useAuth();
  const [otp, setOtp] = useState(pendingResetOtp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

  const criteriaMet = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLevel =
    newPassword.length === 0 ? 0 : criteriaMet <= 2 ? 1 : criteriaMet <= 3 ? 2 : criteriaMet <= 4 ? 3 : 4;

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#087f8c'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || !newPassword || !confirmNewPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (criteriaMet < 5) {
      setError(
        'Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword({
        email: pendingOtpEmail,
        otp: otp.trim(),
        newPassword,
        confirmNewPassword,
      });
    } catch (err: any) {
      setError(err?.message || 'Password reset failed. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-header">
        <div className="otp-icon-badge">
          <KeyRound size={28} />
        </div>
        <h3>Set New Password</h3>
        <p>
          Enter the 6-digit verification code sent to{' '}
          <strong className="highlight-email">{pendingOtpEmail}</strong> and specify your new password.
        </p>
      </div>

      {error && (
        <div className="auth-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {pendingResetOtp ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#166534',
            marginBottom: '16px',
          }}
        >
          <CheckCircle2 size={16} color="#16a34a" />
          <span>
            Security Code Verified: <strong>{otp}</strong>
          </span>
        </div>
      ) : (
        <div className="form-group">
          <label htmlFor="reset-otp">6-Digit Verification Code</label>
          <div className="input-wrapper">
            <input
              id="reset-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="e.g. 123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              required
              style={{ letterSpacing: '4px', fontWeight: 600 }}
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="reset-new-password">New Password</label>
        <div className="input-wrapper">
          <Lock className="input-icon" size={18} />
          <input
            id="reset-new-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
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

        {newPassword.length > 0 && (
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
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="reset-confirm-password">Confirm New Password</label>
        <div className="input-wrapper">
          <Lock className="input-icon" size={18} />
          <input
            id="reset-confirm-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repeat new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
            required
          />
          {confirmNewPassword && confirmNewPassword === newPassword && (
            <CheckCircle2 size={18} className="match-icon" />
          )}
        </div>
      </div>

      <button type="submit" className="auth-submit-btn" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="spinner" size={18} />
            Updating Password...
          </>
        ) : (
          <>
            Reset Password
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <div className="auth-switch-footer">
        <button
          type="button"
          className="switch-link"
          onClick={() => setAuthModalView('login')}
        >
          Cancel and return to Sign In
        </button>
      </div>
    </form>
  );
};
