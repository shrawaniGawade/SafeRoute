import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export const LoginForm: React.FC<{ adminOnly?: boolean }> = ({ adminOnly = false }) => {
  const { login, setAuthModalView } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isValidEmail = (addr: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Please provide both email and password.');
      setSuccess('');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await login({ email: trimmedEmail, password }, adminOnly ? 'admin' : undefined);
      setSuccess('Login successful');
      setError('');
      setTimeout(() => {
        if (response?.user?.role === 'admin') {
          window.location.hash = '#/admin';
        } else {
          window.location.hash = '#/app';
        }
      }, 500);
    } catch (err: any) {
      setSuccess('');
      if (err?.status === 401 || err?.message?.toLowerCase().includes('invalid email or password')) {
        setError('Invalid email or password.');
      } else if (err?.data?.unverified) {
        setError('Your account is pending email verification. Enter the 6-digit code sent to your email, or request a new one on the next screen.');
      } else {
        setError(err?.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-header">
        <h3>{adminOnly ? 'Administrator sign in' : 'Welcome back'}</h3>
        <p>{adminOnly ? 'Use your administrator credentials to open the command center.' : 'Sign in to SafeRoute to continue planning safer routes.'}</p>
      </div>

      {error && (
        <div className="auth-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="auth-alert success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="login-email">Email Address</label>
        <div className="input-wrapper">
          <Mail className="input-icon" size={18} />
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
              if (success) setSuccess('');
            }}
            disabled={loading}
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <div className="label-row">
          <label htmlFor="login-password">Password</label>
          <button
            type="button"
            className="link-btn"
            onClick={() => setAuthModalView('forgot')}
            tabIndex={-1}
          >
            Forgot password?
          </button>
        </div>
        <div className="input-wrapper">
          <Lock className="input-icon" size={18} />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
              if (success) setSuccess('');
            }}
            disabled={loading}
            autoComplete="current-password"
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
      </div>

      <button type="submit" className="auth-submit-btn" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="spinner" size={18} />
            Signing In...
          </>
        ) : (
          <>
            Sign In
            <ArrowRight size={18} />
          </>
        )}
      </button>

      {!adminOnly && (
        <div className="auth-switch-footer">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="switch-link"
            onClick={() => setAuthModalView('register')}
          >
            Create one now
          </button>
        </div>
      )}
    </form>
  );
};
