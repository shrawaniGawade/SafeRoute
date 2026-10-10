import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Loader2, Shield } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login, setAuthModalView } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillAdminCredentials = () => {
    setEmail('admin@saferoute.com');
    setPassword('Admin@12345');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-header">
        <h3>Welcome Back</h3>
        <p>Sign in to your SafeRoute account to access saved routes & personalized safety scoring.</p>
      </div>

      <div
        style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ fontSize: '12px', color: '#166534' }}>
          <strong>Admin Account:</strong> admin@saferoute.com
        </div>
        <button
          type="button"
          onClick={fillAdminCredentials}
          style={{
            background: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Shield size={12} />
          Auto-fill Admin
        </button>
      </div>

      {error && (
        <div className="auth-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
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
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
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
    </form>
  );
};
