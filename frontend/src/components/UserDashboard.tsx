import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  History,
  ArrowRight,
  TrendingUp,
  Moon,
  Zap,
  Shield,
  Clock,
  Layers,
  LogOut
} from 'lucide-react';
import DotGrid from './DotGrid';
import { useAuth } from '../context/AuthContext';
import { usePredictions, type RoutePredictionRecord } from '../context/PredictionContext';
import { useAiStatus } from '../hooks/useAiStatus';
import { predictRouteSafety, type SafetyInput, type SafetyResult } from '../services/api';
import { ScoreBadge } from './common/ScoreBadge';
import { EmptyState } from './common/EmptyState';
import { LoadingSpinner } from './common/LoadingSpinner';
import { LocationInput } from './common/LocationInput';
import './UserDashboard.css';

interface UserDashboardProps {
  onNavigate?: (route: string) => void;
  onOpenAdmin?: () => void;
  onLogout?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onNavigate = () => {},
  onOpenAdmin,
  onLogout,
}) => {
  const { user } = useAuth();
  const aiStatus = useAiStatus();
  const { history, stats, recordPrediction, setCurrentPrediction } = usePredictions();

  // Search Form State
  const [source, setSource] = useState('Central Square, Cambridge, MA');
  const [destination, setDestination] = useState('Boston Common, Boston, MA');
  const [profile, setProfile] = useState<'night' | 'commute' | 'maximum'>('night');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [latestResult, setLatestResult] = useState<RoutePredictionRecord | null>(null);

  // Preset factors
  const getFactorsForProfile = (p: 'night' | 'commute' | 'maximum'): SafetyInput => {
    switch (p) {
      case 'night':
        return { lighting: 9, crime_risk: 1, accident_risk: 2, crowd_level: 8 };
      case 'commute':
        return { lighting: 7, crime_risk: 2, accident_risk: 3, crowd_level: 7 };
      case 'maximum':
        return { lighting: 10, crime_risk: 1, accident_risk: 1, crowd_level: 9 };
    }
  };

  const isSameLocation = Boolean(
    source.trim() &&
    destination.trim() &&
    source.trim().toLowerCase() === destination.trim().toLowerCase()
  );

  const isFormValid = Boolean(
    source.trim() &&
    destination.trim() &&
    !isSameLocation
  );

  const handleQuickEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !destination.trim()) {
      setError('Please provide both starting point and destination.');
      return;
    }

    if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setError('Choose two different locations');
      return;
    }

    setLoading(true);
    setError('');

    const factors = getFactorsForProfile(profile);

    try {
      const result: SafetyResult = await predictRouteSafety(factors);
      const newRecord = recordPrediction({
        source,
        destination,
        departureTime: 'Immediate',
        travelMode: 'walking',
        profile,
        factors,
        result,
      });
      setLatestResult(newRecord);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInMapFinder = () => {
    onNavigate('routes');
  };

  const handleInspectPrediction = (record: RoutePredictionRecord) => {
    setCurrentPrediction(record);
    onNavigate('prediction-details');
  };

  return (
    <div className="user-dash-container">
      {/* 1. Welcome Section */}
      <section className="user-dash-welcome-card" aria-label="Welcome Overview">
        <div className="welcome-decor-canvas">
          <DotGrid
            dotSize={4}
            gap={20}
            baseColor="#3f3f46"
            activeColor="#fafafa"
            proximity={120}
            shockRadius={200}
            shockStrength={3}
            resistance={700}
            returnDuration={1.2}
          />
        </div>

        <div className="welcome-inner">
          <div className="welcome-text-meta">
            <h2>Welcome back, {user?.name || 'Commuter'}!</h2>
            <p>
              Your intelligent urban navigation companion is ready. Analyze real-time lighting,
              historical crime density, and crowd levels across your planned routes.
            </p>
            <div className="welcome-badges-row">
              <span className="welcome-pill">
                <ShieldCheck size={14} />
                Verified Traveler
              </span>
              <span className={`welcome-pill ${aiStatus === 'OFFLINE' ? 'welcome-pill-offline' : ''}`}>
                <Sparkles size={14} />
                {aiStatus === 'ONLINE'
                  ? 'AI Inference Online'
                  : aiStatus === 'OFFLINE'
                  ? 'AI Inference Offline'
                  : 'Checking AI Inference'}
              </span>
              {user?.role === 'admin' && (
                <span className="welcome-pill welcome-pill-admin">
                  <ShieldAlert size={14} />
                  Administrator
                </span>
              )}
            </div>
          </div>

          <div className="welcome-actions">
            <button
              type="button"
              className="welcome-btn-primary"
              onClick={handleOpenInMapFinder}
            >
              <Compass size={18} />
              <span>Launch Route Map</span>
            </button>

            {user?.role === 'admin' && (
              <button
                type="button"
                className="welcome-btn-primary welcome-btn-admin"
                onClick={onOpenAdmin || (() => onNavigate('admin'))}
              >
                <ShieldAlert size={16} />
                <span>Admin Console</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                className="welcome-btn-primary welcome-btn-ghost"
                onClick={onLogout}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Safety Statistics Based on Actual Stored Data */}
      <section aria-label="Stored Route Statistics">
        <div className="stats-cards-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper blue">
              <Layers size={22} />
            </div>
            <div className="stat-content-col">
              <span className="stat-label">Evaluated Corridors</span>
              <span className="stat-number">{stats.totalEvaluated}</span>
              <span className="stat-subtext">Stored in your local session</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper green">
              <TrendingUp size={22} />
            </div>
            <div className="stat-content-col">
              <span className="stat-label">Average Safety Score</span>
              <span className="stat-number">
                {stats.totalEvaluated > 0 ? `${stats.averageScore}/100` : '—'}
              </span>
              <span className="stat-subtext">Across evaluated journeys</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper amber">
              <ShieldCheck size={22} />
            </div>
            <div className="stat-content-col">
              <span className="stat-label">Safe Corridors (80+)</span>
              <span className="stat-number">{stats.safeCount}</span>
              <span className="stat-subtext">High illumination & low risk</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper rose">
              <AlertTriangle size={22} />
            </div>
            <div className="stat-content-col">
              <span className="stat-label">Caution Corridors</span>
              <span className="stat-number">{stats.cautionCount + stats.highRiskCount}</span>
              <span className="stat-subtext">Low light or isolated zones</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Dashboard Two-Column Grid: Route Search Form + Recent History */}
      <div className="dash-content-grid">
        {/* Left: Route Search Form */}
        <section className="dash-panel" aria-label="Quick Route Evaluation">
          <div className="dash-panel-header">
            <div className="dash-panel-title">
              <MapPin size={20} />
              <div>
                <h3>Quick Route Safety Evaluation</h3>
                <span>Run instant machine learning scoring</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleQuickEvaluate} className="quick-route-form">
            <LocationInput
              id="dash-source"
              label="Starting Location"
              value={source}
              onChange={(val) => {
                setSource(val);
                if (error) setError('');
              }}
              onSelectLocation={(loc) => {
                setSource(loc.displayName);
                if (error) setError('');
              }}
              placeholder="Search starting location..."
              icon="origin"
              required
            />

            <LocationInput
              id="dash-dest"
              label="Destination"
              value={destination}
              onChange={(val) => {
                setDestination(val);
                if (error) setError('');
              }}
              onSelectLocation={(loc) => {
                setDestination(loc.displayName);
                if (error) setError('');
              }}
              placeholder="Search destination..."
              icon="destination"
              required
            />

            <div className="quick-input-group">
              <label>Safety Priority Preset</label>
              <div className="quick-profile-pills">
                <button
                  type="button"
                  className={`profile-chip ${profile === 'night' ? 'active' : ''}`}
                  onClick={() => setProfile('night')}
                >
                  <Moon size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Well-Lit Night Walk
                </button>
                <button
                  type="button"
                  className={`profile-chip ${profile === 'commute' ? 'active' : ''}`}
                  onClick={() => setProfile('commute')}
                >
                  <Zap size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Direct Commute
                </button>
                <button
                  type="button"
                  className={`profile-chip ${profile === 'maximum' ? 'active' : ''}`}
                  onClick={() => setProfile('maximum')}
                >
                  <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Maximum Caution
                </button>
              </div>
            </div>

            {isSameLocation && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--ti-warn-bg, rgba(251, 191, 36, 0.1))',
                  border: '1px solid var(--ti-warn-line, rgba(251, 191, 36, 0.24))',
                  color: 'var(--ti-warn, #fbbf24)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
                role="alert"
              >
                <AlertTriangle size={16} />
                <span>Choose two different locations</span>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--ti-danger-bg, rgba(248, 113, 113, 0.1))',
                  border: '1px solid var(--ti-danger-line, rgba(248, 113, 113, 0.24))',
                  borderRadius: '10px',
                  color: 'var(--ti-danger, #f87171)',
                  fontSize: '13px',
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="form-action-row">
              <button
                type="submit"
                className="btn-evaluate"
                disabled={loading || !isFormValid}
              >
                <Sparkles size={16} />
                <span>{loading ? 'Evaluating Model...' : 'Calculate Safety Score'}</span>
              </button>

              <button
                type="button"
                className="btn-open-map"
                onClick={handleOpenInMapFinder}
              >
                <span>Interactive Map</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

          {/* Real-time Inline Result if evaluated */}
          {loading && (
            <div style={{ marginTop: '20px' }}>
              <LoadingSpinner message="Querying SafeRoute AI Scoring Model..." />
            </div>
          )}

          {latestResult && !loading && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                background: 'var(--ti-surface-2, #141416)',
                border: '1px solid var(--ti-line, rgba(255, 255, 255, 0.09))',
                borderRadius: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ti-muted, #a1a1aa)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Latest Evaluation
                </span>
                <h4 style={{ margin: '4px 0', fontSize: '15px', color: 'var(--ti-ink, #f4f4f5)' }}>
                  {latestResult.source} &rarr; {latestResult.destination}
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--ti-muted, #a1a1aa)' }}>
                  Engine: {latestResult.result.model} &bull; Classification: {latestResult.result.data_type}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ScoreBadge score={latestResult.result.safety_score} size="md" />
                <button
                  type="button"
                  className="btn-inspect-history"
                  onClick={() => handleInspectPrediction(latestResult)}
                >
                  <span>Full Audit</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right: Recent Prediction History */}
        <section className="dash-panel" aria-label="Recent Prediction History">
          <div className="dash-panel-header">
            <div className="dash-panel-title">
              <History size={20} />
              <div>
                <h3>Recent Route Evaluations</h3>
                <span>Saved predictions ({history.length})</span>
              </div>
            </div>
          </div>

          {history.length === 0 ? (
            <EmptyState
              icon={<Compass size={32} />}
              title="No Evaluated Corridors Yet"
              description="Enter your origin and destination on the left to evaluate route safety factors using the AI model."
              actionLabel="Explore Interactive Map"
              onAction={handleOpenInMapFinder}
            />
          ) : (
            <div className="history-cards-col">
              {history.map((item) => (
                <div key={item.id} className="history-card-item">
                  <div className="history-card-left">
                    <div className="history-route-endpoints" title={`${item.source} → ${item.destination}`}>
                      {item.source} &rarr; {item.destination}
                    </div>
                    <div className="history-meta-sub">
                      <span>
                        <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>&bull;</span>
                      <span style={{ textTransform: 'capitalize' }}>{item.profile} priority</span>
                    </div>
                  </div>

                  <div className="history-card-right">
                    <ScoreBadge score={item.result.safety_score} size="sm" />
                    <button
                      type="button"
                      className="btn-inspect-history"
                      onClick={() => handleInspectPrediction(item)}
                      title="Inspect AI safety metrics"
                    >
                      <span>Audit</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserDashboard;
