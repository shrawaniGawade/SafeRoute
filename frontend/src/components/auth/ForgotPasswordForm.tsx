import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowRight, ArrowLeft, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export const ForgotPasswordForm: React.FC = () => {
  const { forgotPassword, setAuthModalView } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await forgotPassword(email.trim());
    } catch (err: any) {
      setError(err?.message || 'Failed to request reset. Please try again.');
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
        <h3>Reset Your Password</h3>
        <p>
          Enter your registered email address and we will dispatch a secure 6-digit verification code to reset your credentials.
        </p>
      </div>

      {error && (
        <div className="auth-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="forgot-email">Account Email</label>
        <div className="input-wrapper">
          <Mail className="input-icon" size={18} />
          <input
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            required
          />
        </div>
      </div>

      <button type="submit" className="auth-submit-btn" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="spinner" size={18} />
            Sending Code...
          </>
        ) : (
          <>
            Send Verification Code
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <div className="auth-switch-footer">
        <button
          type="button"
          className="back-btn"
          onClick={() => setAuthModalView('login')}
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </button>
      </div>
    </form>
  );
};
