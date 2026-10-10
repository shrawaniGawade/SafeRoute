import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export const RegisterForm: React.FC = () => {
  const { register, setAuthModalView } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  const strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#087f8c'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill out all required fields.');
      return;
    }

    if (password !== confirmPassword) {
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
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-header">
        <h3>Join SafeRoute</h3>
        <p>Create your account to unlock real-time safety navigation and personalized route reports.</p>
      </div>

      {error && (
        <div className="auth-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

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
            disabled={loading}
            autoComplete="name"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="register-email">Email Address</label>
        <div className="input-wrapper">
          <Mail className="input-icon" size={18} />
          <input
            id="register-email"
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
        <label htmlFor="register-password">Password</label>
        <div className="input-wrapper">
          <Lock className="input-icon" size={18} />
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="register-confirm-password">Confirm Password</label>
        <div className="input-wrapper">
          <Lock className="input-icon" size={18} />
          <input
            id="register-confirm-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
            required
          />
          {confirmPassword && confirmPassword === password && (
            <CheckCircle2 size={18} className="match-icon" />
          )}
        </div>
      </div>

      <button type="submit" className="auth-submit-btn" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="spinner" size={18} />
            Creating Account...
          </>
        ) : (
          <>
            Create SafeRoute Account
            <ArrowRight size={18} />
          </>
        )}
      </button>

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
