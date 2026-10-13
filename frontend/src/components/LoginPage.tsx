import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { OtpForm } from './auth/OtpForm';
import { ForgotPasswordForm } from './auth/ForgotPasswordForm';
import { ResetPasswordForm } from './auth/ResetPasswordForm';
import {
  Shield,
  ArrowRight,
  Lock,
  Sparkles,
  Moon,
  Zap,
  Users
} from 'lucide-react';
import './LoginPage.css';

interface LoginPageProps {
  onExploreLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onExploreLanding }) => {
  const { authModalView, setAuthModalView } = useAuth();

  // Default to 'login' view if loaded in another state
  useEffect(() => {
    if (authModalView !== 'login' && authModalView !== 'register' && authModalView !== 'otp' && authModalView !== 'forgot' && authModalView !== 'reset') {
      setAuthModalView('login');
    }
  }, [authModalView, setAuthModalView]);

  const showTabs = authModalView === 'login' || authModalView === 'register';

  return (
    <div className="login-page-root">
      {/* Top Header Bar */}
      <header className="login-header-bar">
        <div className="login-brand-group" onClick={onExploreLanding} title="Explore SafeRoute Overview">
          <div className="login-logo-badge">
            <Shield size={24} />
          </div>
          <div className="login-brand-meta">
            <h1>SafeRoute</h1>
            <span>Smarter Journeys. Safer Choices.</span>
          </div>
        </div>

        <div className="login-header-actions">
          <div className="system-status-indicator">
            <span className="status-dot-pulse" />
            <span>AI Safety Engine Active</span>
          </div>

          <button
            type="button"
            className="explore-landing-btn"
            onClick={onExploreLanding}
            aria-label="View SafeRoute landing page"
          >
            <span>Explore Overview</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Main Two-Column Container */}
      <main className="login-main-container">
        {/* Left Column: Brand & Security Showcase */}
        <section className="login-showcase-column">
          <div className="login-tagline-badge">
            <Sparkles size={14} />
            <span>AI-Powered Safety Intelligence</span>
          </div>

          <h2>
            Navigate with confidence.{' '}
            <span className="text-gradient-cyan">Safety-first routing</span> for every journey.
          </h2>

          <p className="login-showcase-desc">
            SafeRoute analyzes live crime rates, streetlight illumination, accident frequency, and crowd density
            to calculate the safest walkable and drivable path to your destination.
          </p>

          {/* Key Metrics */}
          <div className="login-metrics-grid">
            <div className="login-metric-card">
              <div className="metric-number cyan">0–100</div>
              <div className="metric-label">Composite Safety Score</div>
            </div>
            <div className="login-metric-card">
              <div className="metric-number">4 Factors</div>
              <div className="metric-label">Crime • Light • Crowd • Crash</div>
            </div>
            <div className="login-metric-card">
              <div className="metric-number cyan">24/7</div>
              <div className="metric-label">Active Threat Telemetry</div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="login-features-list">
            <div className="login-feature-item">
              <div className="feature-icon-wrapper">
                <Moon size={18} />
              </div>
              <div className="feature-text-block">
                <h4>Night Traveler Corridors</h4>
                <p>Prioritizes actively lit commercial streets and CCTV coverage after dark.</p>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="feature-icon-wrapper">
                <Users size={18} />
              </div>
              <div className="feature-text-block">
                <h4>Pedestrian Density Sensing</h4>
                <p>Avoids secluded alleys by factoring foot-traffic activity and verified safe zones.</p>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="feature-icon-wrapper">
                <Zap size={18} />
              </div>
              <div className="feature-text-block">
                <h4>Customizable Safety Profiles</h4>
                <p>Tailor your journey with presets: Night Traveler, Well-Lit, or Maximum Crowd.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Authentication Card */}
        <section className="login-form-column">
          <div className="login-auth-card">
            {showTabs && (
              <div className="login-tabs-nav" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={authModalView === 'login'}
                  className={`login-tab-button ${authModalView === 'login' ? 'active' : ''}`}
                  onClick={() => setAuthModalView('login')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authModalView === 'register'}
                  className={`login-tab-button ${authModalView === 'register' ? 'active' : ''}`}
                  onClick={() => setAuthModalView('register')}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Dynamic View rendering */}
            <div className="login-card-content">
              {authModalView === 'login' && <LoginForm />}
              {authModalView === 'register' && <RegisterForm />}
              {authModalView === 'otp' && <OtpForm />}
              {authModalView === 'forgot' && <ForgotPasswordForm />}
              {authModalView === 'reset' && <ResetPasswordForm />}
            </div>
          </div>

          {/* Security Guarantee Badge */}
          <div className="login-security-guarantee">
            <Lock size={14} />
            <span>256-bit TLS Encryption • Refresh Token Rotation • Secure JWT Auth</span>
          </div>
        </section>
      </main>

      {/* Page Footer */}
      <footer className="login-page-footer">
        <div>SafeRoute &copy; 2026. All rights reserved.</div>
        <div className="footer-links">
          <button type="button" onClick={onExploreLanding}>Landing Page</button>
          <a href="#about" onClick={(e) => { e.preventDefault(); onExploreLanding(); }}>About SafeRoute</a>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); onExploreLanding(); }}>How It Works</a>
        </div>
      </footer>
    </div>
  );
};
