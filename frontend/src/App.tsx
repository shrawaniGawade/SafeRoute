import { useState, useRef, useEffect } from 'react';
import './App.css';
import DotGrid from './components/DotGrid';
import { predictRouteSafety } from './services/api';
import type { SafetyResult } from './services/api';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import {
  User,
  LogOut,
  CheckCircle,
  ChevronDown,
  Shield,
  LayoutDashboard,
  Moon,
  Zap,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  RotateCcw
} from 'lucide-react';


import { Analytics } from '@vercel/analytics/react';

function App() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [result, setResult] = useState<SafetyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);

  // Safety profile tuner states
  const [routeProfile, setRouteProfile] = useState<'night' | 'commute' | 'maximum' | 'custom'>('night');
  const [lightingFactor, setLightingFactor] = useState(9);
  const [crimeRiskFactor, setCrimeRiskFactor] = useState(1);
  const [accidentRiskFactor, setAccidentRiskFactor] = useState(2);
  const [crowdLevelFactor, setCrowdLevelFactor] = useState(8);
  const [showFactorTuners, setShowFactorTuners] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, openAuthModal, logout, toastMessage } = useAuth();

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to /admin and #admin routes for direct URL link access
  useEffect(() => {
    function checkAdminRoute() {
      const isAdminPath =
        window.location.hash === '#admin' ||
        window.location.pathname === '/admin' ||
        window.location.pathname.startsWith('/admin');

      if (isAdminPath) {
        if (isAuthenticated && user?.role === 'admin') {
          setAdminDashboardOpen(true);
        } else if (!isAuthenticated) {
          openAuthModal('login');
        }
      }
    }

    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('popstate', checkAdminRoute);
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('popstate', checkAdminRoute);
    };
  }, [isAuthenticated, user, openAuthModal]);

  const handleOpenAdminDashboard = () => {
    setDropdownOpen(false);
    setAdminDashboardOpen(true);
    window.location.hash = '#admin';
  };

  const handleCloseAdminDashboard = () => {
    setAdminDashboardOpen(false);
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    if (window.location.pathname === '/admin') {
      window.history.replaceState(null, '', '/' + window.location.search);
    }
  };

  const handleSelectProfile = (profile: 'night' | 'commute' | 'maximum' | 'custom') => {
    setRouteProfile(profile);
    if (profile === 'night') {
      setLightingFactor(9);
      setCrimeRiskFactor(1);
      setAccidentRiskFactor(2);
      setCrowdLevelFactor(8);
      setShowFactorTuners(false);
    } else if (profile === 'commute') {
      setLightingFactor(7);
      setCrimeRiskFactor(3);
      setAccidentRiskFactor(3);
      setCrowdLevelFactor(6);
      setShowFactorTuners(false);
    } else if (profile === 'maximum') {
      setLightingFactor(10);
      setCrimeRiskFactor(0);
      setAccidentRiskFactor(1);
      setCrowdLevelFactor(9);
      setShowFactorTuners(false);
    } else if (profile === 'custom') {
      setShowFactorTuners(true);
    }
  };

  async function handleFindSafeRoute() {
    if (!source.trim() || !destination.trim()) {
      setError('Please enter both source and destination.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const prediction = await predictRouteSafety({
        lighting: lightingFactor,
        crime_risk: crimeRiskFactor,
        accident_risk: accidentRiskFactor,
        crowd_level: crowdLevelFactor,
      });

      setResult(prediction);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {toastMessage && (
        <aside className={`toast-notification ${toastMessage.type}`} role="status">
          <span>{toastMessage.text}</span>
        </aside>
      )}

      <header className="navbar">
        <h2>SafeRoute</h2>

        <nav>
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a
            href="#admin"
            onClick={(e) => {
              e.preventDefault();
              if (isAuthenticated && user?.role === 'admin') {
                handleOpenAdminDashboard();
              } else {
                openAuthModal('login');
              }
            }}
            style={{
              color: '#087f8c',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              background: '#e0f2fe',
              borderRadius: '6px',
              border: '1px solid #bae6fd',
            }}
          >
            <Shield size={14} /> Admin Dashboard
          </a>
        </nav>

        {isAuthenticated && user ? (
          <div className="user-menu-container" ref={dropdownRef}>
            <button
              className="user-profile-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-label="User profile menu"
            >
              <div className="avatar-circle">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user.name}</span>
              <ChevronDown size={14} className={`chevron ${dropdownOpen ? 'open' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-header">
                  <p className="dropdown-name">{user.name}</p>
                  <p className="dropdown-email">{user.email}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <span className="verified-badge">
                      <CheckCircle size={12} />
                      Verified
                    </span>
                    {user.role === 'admin' && (
                      <span className="verified-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                        <Shield size={12} />
                        Admin
                      </span>
                    )}
                  </div>

                </div>
                <div className="dropdown-divider" />
                {user.role === 'admin' && (
                  <button
                    className="dropdown-item"
                    style={{ color: '#087f8c', fontWeight: 600 }}
                    onClick={handleOpenAdminDashboard}
                  >
                    <LayoutDashboard size={16} />
                    Admin Console
                  </button>
                )}
                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="login-btn"
            onClick={() => openAuthModal('login')}
          >
            <User size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Sign In
          </button>
        )}
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-dot-bg" aria-hidden="true">
            <DotGrid
              dotSize={6}
              gap={22}
              baseColor="#b9e4e8"
              activeColor="#087f8c"
              proximity={140}
              shockRadius={250}
              shockStrength={4}
              resistance={750}
              returnDuration={1.5}
            />
          </div>

          <div className="hero-content">
            <p className="tagline">SMARTER JOURNEYS. SAFER CHOICES.</p>

            <h1>
              Your Journey,
              <br />
              Your Safety.
            </h1>

            <p className="description">
              Find a route with safety in mind. SafeRoute uses AI-based
              demo safety scoring to help demonstrate a smarter approach
              to route planning.
            </p>

            {/* Route Profiles Selector */}
            <div className="profile-selector-container">
              <span className="profile-selector-label">Safety Priority:</span>
              <div className="profile-pills">
                <button
                  type="button"
                  className={`profile-pill ${routeProfile === 'night' ? 'active' : ''}`}
                  onClick={() => handleSelectProfile('night')}
                >
                  <Moon size={14} />
                  Well-Lit Night Walk
                </button>
                <button
                  type="button"
                  className={`profile-pill ${routeProfile === 'commute' ? 'active' : ''}`}
                  onClick={() => handleSelectProfile('commute')}
                >
                  <Zap size={14} />
                  Direct Commute
                </button>
                <button
                  type="button"
                  className={`profile-pill ${routeProfile === 'maximum' ? 'active' : ''}`}
                  onClick={() => handleSelectProfile('maximum')}
                >
                  <Shield size={14} />
                  Maximum Caution
                </button>
                <button
                  type="button"
                  className={`profile-pill ${routeProfile === 'custom' ? 'active' : ''}`}
                  onClick={() => handleSelectProfile('custom')}
                >
                  <SlidersHorizontal size={14} />
                  Custom Factors
                </button>
              </div>
            </div>

            {/* Custom Sliders (Shown when Custom is selected) */}
            {showFactorTuners && (
              <div className="custom-factors-card">
                <div className="factor-slider-row">
                  <label>
                    Street Lighting: <strong>{lightingFactor}/10</strong>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={lightingFactor}
                      onChange={(e) => setLightingFactor(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Crime Risk Index: <strong>{crimeRiskFactor}/10</strong>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={crimeRiskFactor}
                      onChange={(e) => setCrimeRiskFactor(Number(e.target.value))}
                    />
                  </label>
                </div>
                <div className="factor-slider-row">
                  <label>
                    Accident Risk: <strong>{accidentRiskFactor}/10</strong>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={accidentRiskFactor}
                      onChange={(e) => setAccidentRiskFactor(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Foot Traffic / Crowd: <strong>{crowdLevelFactor}/10</strong>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={crowdLevelFactor}
                      onChange={(e) => setCrowdLevelFactor(Number(e.target.value))}
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="route-form">
              <label>
                Starting Point
                <div className="input-with-icon">
                  <MapPin size={16} className="route-input-icon" />
                  <input
                    type="text"
                    placeholder="e.g., Central Station, MG Road"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  />
                </div>
              </label>

              <label>
                Destination
                <div className="input-with-icon">
                  <MapPin size={16} className="route-input-icon" />
                  <input
                    type="text"
                    placeholder="e.g., City Library, North Campus"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </label>

              <button
                className="search-btn"
                onClick={handleFindSafeRoute}
                disabled={loading}
              >
                <Sparkles size={16} />
                {loading ? 'Evaluating AI Safety...' : 'Find a Safe Route'}
              </button>
            </div>

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            {result && (
              <section className="result-card" aria-live="polite">
                <div className="result-card-header">
                  <div>
                    <span className="route-badge">
                      {result.safety_score >= 80 ? '🌟 High Safety Level' : result.safety_score >= 50 ? '⚠️ Moderate Caution' : '🚨 High Caution Advised'}
                    </span>
                    <h2>Journey Safety Evaluation</h2>
                    <p className="route-endpoints">
                      <strong>{source}</strong> &rarr; <strong>{destination}</strong>
                    </p>
                  </div>
                  <div className="score-badge-circle-main">
                    <span className="score-num">{result.safety_score}</span>
                    <span className="score-denom">/100</span>
                  </div>
                </div>

                <div className="metrics-breakdown-grid">
                  <div className="metric-bar-item">
                    <div className="metric-label-row">
                      <span>💡 Street Illumination</span>
                      <strong>{lightingFactor * 10}%</strong>
                    </div>
                    <div className="metric-progress-bg">
                      <div className="metric-progress-fill" style={{ width: `${lightingFactor * 10}%`, background: '#087f8c' }} />
                    </div>
                  </div>

                  <div className="metric-bar-item">
                    <div className="metric-label-row">
                      <span>🛡️ Crime Suppression Index</span>
                      <strong>{(10 - crimeRiskFactor) * 10}%</strong>
                    </div>
                    <div className="metric-progress-bg">
                      <div className="metric-progress-fill" style={{ width: `${(10 - crimeRiskFactor) * 10}%`, background: '#10b981' }} />
                    </div>
                  </div>

                  <div className="metric-bar-item">
                    <div className="metric-label-row">
                      <span>🚦 Traffic Hazard Safety</span>
                      <strong>{(10 - accidentRiskFactor) * 10}%</strong>
                    </div>
                    <div className="metric-progress-bg">
                      <div className="metric-progress-fill" style={{ width: `${(10 - accidentRiskFactor) * 10}%`, background: '#3b82f6' }} />
                    </div>
                  </div>

                  <div className="metric-bar-item">
                    <div className="metric-label-row">
                      <span>👥 Bystander Activity</span>
                      <strong>{crowdLevelFactor * 10}%</strong>
                    </div>
                    <div className="metric-progress-bg">
                      <div className="metric-progress-fill" style={{ width: `${crowdLevelFactor * 10}%`, background: '#8b5cf6' }} />
                    </div>
                  </div>
                </div>

                <div className="safety-advice-card">
                  <h4>💡 Route Safety Advisory</h4>
                  <p>
                    {result.safety_score >= 80
                      ? 'This route exhibits high street illumination and active pedestrian presence. Recommended for evening walking.'
                      : result.safety_score >= 50
                      ? 'Stay on primary boulevards. Keep phones charged and stay within populated areas.'
                      : 'Low illumination or elevated risk factors detected along this corridor. Consider ride-sharing or well-lit transit.'}
                  </p>
                </div>

                <div className="result-footer-meta">
                  <span>Engine: {result.model} &bull; Classification: {result.data_type}</span>
                  <button
                    className="recalc-btn"
                    onClick={() => setResult(null)}
                  >
                    <RotateCcw size={13} />
                    Clear
                  </button>
                </div>
              </section>
            )}
          </div>
        </section>

        <section className="features" id="features">
          <article className="feature-card">
            <span>🛡️</span>
            <h3>Safety-Aware Planning</h3>
            <p>
              Explore how lighting, crime risk, accident risk, and
              crowd levels can contribute to a route safety score.
            </p>
          </article>

          <article className="feature-card">
            <span>🤖</span>
            <h3>AI-Powered Scoring</h3>
            <p>
              A Random Forest model generates a demonstration score
              from the supplied safety factors.
            </p>
          </article>

          <article className="feature-card">
            <span>📍</span>
            <h3>Route Planning</h3>
            <p>
              Source and destination entry is ready. Real map-based
              route calculation is a future integration step.
            </p>
          </article>
        </section>

        <section className="about-section" id="about">
          <h2>About SafeRoute</h2>
          <p>
            SafeRoute is a project prototype exploring safety-aware
            navigation. Its current score uses demo inputs and is not
            validated for real-world safety decisions.
          </p>
        </section>
      </main>

      <footer>
        <p>© 2026 SafeRoute | AI-Powered Safety-Aware Route Planning</p>
      </footer>

      <AuthModal />
      <AdminDashboard
        isOpen={adminDashboardOpen}
        onClose={handleCloseAdminDashboard}
      />
      <Analytics />
    </>
  );
}

export default App;
