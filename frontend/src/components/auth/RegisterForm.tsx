import React, { useState } from 'react';
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
  Check,
  Circle,
} from 'lucide-react';

export const RegisterForm: React.FC = () => {
  const { register, setAuthModalView } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);

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
  const strengthColors = [
    '',
    'var(--auth-strength-1)',
    'var(--auth-strength-2)',
    'var(--auth-strength-3)',
    'var(--auth-strength-4)',
  ];

  const requirements = [
    { label: 'At least 8 characters', met: hasMinLength },
    { label: 'One uppercase letter', met: hasUpper },
    { label: 'One lowercase letter', met: hasLower },
    { label: 'One number', met: hasNumber },
    { label: 'One special character', met: hasSpecial },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please provide a valid email address.');
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
    setSuccess(null);
    setEmailExists(false);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
      setSuccess('Account created successfully! Welcome to SafeRoute.');
    } catch (err: any) {
      setError(err?.message || 'Account registration failed. Please try again.');
      setEmailExists(err?.status === 409);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-header">
        <h3>Create Your Account</h3>
        <p>Set up your SafeRoute profile to unlock real-time safety navigation.</p>
      </div>

      {error && (
        <div className="auth-alert error">
          <AlertCircle size={18} />
          <div className="auth-alert-body">
            <span>{error}</span>
            {emailExists && (
              <button
                type="button"
                className="auth-alert-link"
                onClick={() => setAuthModalView('login')}
              >
                Sign in instead
              </button>
            )}
          </div>
        </div>
      )}

      {success && (
        <div className="auth-alert success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
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
            disabled={isSubmitting}
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
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
              if (emailExists) setEmailExists(false);
            }}
            disabled={isSubmitting}
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
            placeholder="8+ chars, upper & number"
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

        {password.length > 0 && (
          <div className="password-strength-container">
            <div className="strength-bar-track">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className="strength-step"
                  style={{
                    backgroundColor:
                      step <= strengthLevel
                        ? strengthColors[strengthLevel]
                        : 'var(--auth-strength-track)',
                  }}
                />
              ))}
            </div>
            <div className="strength-label" style={{ color: strengthColors[strengthLevel] }}>
              Strength: {strengthLabels[strengthLevel]}
              {criteriaMet < 5 && (
                <span className="strength-criteria">({criteriaMet}/5 rules)</span>
              )}
            </div>
          </div>
        )}

        {password.length > 0 && (
          <ul className="password-requirements" aria-label="Password requirements">
            {requirements.map((req) => (
              <li key={req.label} className={req.met ? 'met' : ''}>
                {req.met ? <Check size={12} /> : <Circle size={12} />}
                <span>{req.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

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

      <button
        type="submit"
        className="auth-submit-btn"
        disabled={isSubmitting}
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
