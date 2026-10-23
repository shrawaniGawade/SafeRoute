import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import {
  Shield,
  Activity,
  Cpu,
  Server,
  Users,
  CheckCircle2,
  X,
  Database,
  RefreshCw,
  Bell,
  Trash2,
  UserCheck,
  Zap,
  Play,
  Check,
  LogOut,
  Sliders,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import AcidSquares from './AcidSquares';
import {
  PRESETS,
  getDefaultPreset,
  saveDefaultPreset,
  type AcidSquaresPreset
} from '../data/presets';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminStats,
  updateAdminUserRole,
  deleteAdminUser,
  predictRouteSafety
} from '../services/api';
import type { AdminStatsResponse, SafetyResult } from '../services/api';

interface AdminDashboardProps {
  isOpen?: boolean;
  isStandalone?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen = true,
  isStandalone = false,
  onClose,
  onLogout
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'users' | 'ai-model' | 'surface-tuner'>('overview');
  const [tunerPreset, setTunerPreset] = useState<AcidSquaresPreset>(getDefaultPreset);
  const [savedDefaultId, setSavedDefaultId] = useState<string>(() => {
    try {
      return localStorage.getItem('saferoute_default_preset') || 'graphite';
    } catch {
      return 'graphite';
    }
  });
  const [tunerActionMessage, setTunerActionMessage] = useState<string | null>(null);
  const [landingFullView, setLandingFullView] = useState<boolean>(() => {
    try {
      return localStorage.getItem('saferoute_landing_full_view') === 'true';
    } catch {
      return false;
    }
  });

  const handleLandingViewChange = (full: boolean) => {
    setLandingFullView(full);
    try {
      localStorage.setItem('saferoute_landing_full_view', String(full));
    } catch {
      // Storage can be unavailable; the live event below still updates the landing page.
    }
    window.dispatchEvent(
      new CustomEvent('saferoute_landing_view_changed', { detail: full })
    );
    setTunerActionMessage(`Landing view set to ${full ? 'Full View' : 'Hero View'}.`);
    setTimeout(() => setTunerActionMessage(null), 3000);
  };

  useEffect(() => {
    const handleViewChange = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      if (typeof detail === 'boolean') {
        setLandingFullView(detail);
      }
    };
    window.addEventListener('saferoute_landing_view_changed', handleViewChange);
    return () =>
      window.removeEventListener('saferoute_landing_view_changed', handleViewChange);
  }, []);

  const handleSaveAsSystemDefault = () => {
    saveDefaultPreset(tunerPreset);
    setSavedDefaultId(tunerPreset.id);
    setTunerActionMessage(`Saved "${tunerPreset.name}" as the system default preset.`);
    setTimeout(() => setTunerActionMessage(null), 3500);
  };

  const handleResetPresetDefaults = () => {
    const base = PRESETS[tunerPreset.id] || PRESETS.graphite;
    setTunerPreset({ ...base });
    setTunerActionMessage(`Reset "${tunerPreset.name}" to factory default parameters.`);
    setTimeout(() => setTunerActionMessage(null), 3000);
  };
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // AI interactive test states
  const [lighting, setLighting] = useState(8);
  const [crimeRisk, setCrimeRisk] = useState(2);
  const [accidentRisk, setAccidentRisk] = useState(3);
  const [crowdLevel, setCrowdLevel] = useState(7);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiLatency, setAiLatency] = useState<number | null>(null);
  const [aiTestResult, setAiTestResult] = useState<SafetyResult | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await fetchAdminStats();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
      const interval = setInterval(() => {
        loadStats();
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateAdminUserRole(userId, newRole);
      setActionMessage(`Role updated successfully to ${newRole}`);
      setTimeout(() => setActionMessage(null), 3000);
      loadStats();
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to update role');
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete user: ${email}?`)) {
      return;
    }
    try {
      await deleteAdminUser(userId);
      setActionMessage(`User ${email} deleted.`);
      setTimeout(() => setActionMessage(null), 3000);
      loadStats();
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to delete user');
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleRunAiTest = async () => {
    try {
      setAiTesting(true);
      const startTime = performance.now();
      const result = await predictRouteSafety({
        lighting,
        crime_risk: crimeRisk,
        accident_risk: accidentRisk,
        crowd_level: crowdLevel,
      });
      const elapsed = Math.round(performance.now() - startTime);
      setAiLatency(elapsed);
      setAiTestResult(result);
    } catch (err: any) {
      setActionMessage('AI Model probe failed: ' + err.message);
      setTimeout(() => setActionMessage(null), 3500);
    } finally {
      setAiTesting(false);
    }
  };

  if (!isOpen) return null;

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '1m 20s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
  };

  const dashboardCard = (
    <div className={isStandalone ? "admin-page-card" : "admin-modal"} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="admin-header">
        <div className="admin-title-group">
          <div className="admin-badge-icon">
            <Shield size={24} color="#0d9488" />
          </div>
          <div>
            <h2>SafeRoute Admin Command Center</h2>
            <p className="admin-subtitle">
              Logged in as <strong>{user?.name}</strong> ({user?.email}) &bull;{' '}
              <span className="status-live-dot"></span> System Live &bull; Uptime: {formatUptime(data?.server?.uptimeSeconds)}
            </p>
          </div>
        </div>
        <div className="admin-header-actions">
          <button
            className={`refresh-btn ${loading ? 'spinning' : ''}`}
            onClick={loadStats}
            title="Refresh Telemetry"
            disabled={loading}
          >
            <RefreshCw size={16} />
            <span>{loading ? 'Syncing...' : 'Sync Data'}</span>
          </button>
          {onLogout && (
            <button
              type="button"
              className="admin-logout-btn"
              onClick={onLogout}
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          )}
          {!isStandalone && onClose && (
            <button className="admin-close-btn" onClick={onClose} aria-label="Close dashboard">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

        {actionMessage && (
          <div className="admin-action-banner">
            <Check size={16} />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={16} />
            Overview & Telemetry
          </button>
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            User Management ({data?.stats?.totalUsers ?? '...'})
          </button>
          <button
            className={`admin-tab ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Server size={16} />
            Microservices & Health
          </button>
          <button
            className={`admin-tab ${activeTab === 'ai-model' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-model')}
          >
            <Cpu size={16} />
            AI Model Simulator
          </button>
        </div>

        {/* Modal Body */}
        <div className="admin-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="tab-pane">
              {/* Stat Cards */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-icon-wrapper ai">
                    <Cpu size={22} />
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">AI Route Scorer</span>
                    <span className="stat-value">{data?.services?.aiScoringEngine?.status || 'ONLINE'}</span>
                    <span className="stat-sub positive">
                      {data?.services?.aiScoringEngine?.latencyMs ?? 12}ms Latency &bull; Port 8000
                    </span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-icon-wrapper api">
                    <Server size={22} />
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">Backend API Gateway</span>
                    <span className="stat-value">Port {data?.services?.backend?.port || 5000}</span>
                    <span className="stat-sub positive">
                      Memory: {data?.server?.memoryUsageMb ?? 38} MB &bull; Express TS
                    </span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-icon-wrapper users">
                    <Users size={22} />
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">Total User Accounts</span>
                    <span className="stat-value">{data?.stats?.totalUsers ?? 1} Registered</span>
                    <span className="stat-sub">
                      {data?.stats?.verifiedUsers ?? 1} Verified ({data?.stats?.verificationRate ?? 100}%)
                    </span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-icon-wrapper sec">
                    <Shield size={22} />
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">System Security</span>
                    <span className="stat-value">Hardened</span>
                    <span className="stat-sub">Argon2 / JWT / CORS Strict</span>
                  </div>
                </div>
              </div>

              {/* Quick Summary Section */}
              <div className="admin-section">
                <div className="section-header">
                  <h3>Recent Registered Users</h3>
                  <button className="view-all-link" onClick={() => setActiveTab('users')}>
                    Manage all &rarr;
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.users || []).slice(0, 4).map((u) => (
                        <tr key={u.id}>
                          <td><code>{u.id.slice(0, 8)}...</code></td>
                          <td className="font-semibold">{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`role-tag ${u.role}`}>
                              {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                            </span>
                          </td>
                          <td>
                            <span className="verified-tag">
                              <CheckCircle2 size={13} />
                              {u.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="tab-pane">
              <div className="admin-section">
                <div className="section-header">
                  <div>
                    <h3>User Accounts Directory</h3>
                    <p className="section-hint">Control permissions, assign administrator privileges, or manage accounts.</p>
                  </div>
                  <span className="badge-pill">{data?.users?.length || 0} Total Records</span>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Current Role</th>
                        <th>Email Verified</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.users || []).map((u) => (
                        <tr key={u.id}>
                          <td className="font-semibold">{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`role-tag ${u.role}`}>
                              {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                            </span>
                          </td>
                          <td>
                            <span className={`verified-tag ${u.isVerified ? '' : 'pending'}`}>
                              <CheckCircle2 size={13} />
                              {u.isVerified ? 'Verified' : 'Pending OTP'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons-cell">
                              <button
                                className="action-pill-btn"
                                onClick={() => handleToggleRole(u.id, u.role)}
                                title={u.role === 'admin' ? 'Demote to regular user' : 'Promote to Admin'}
                                disabled={u.id === user?.id && u.role === 'admin'}
                              >
                                <UserCheck size={14} />
                                {u.role === 'admin' ? 'Demote' : 'Promote to Admin'}
                              </button>
                              {u.id !== user?.id && (
                                <button
                                  className="action-pill-btn delete"
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  title="Delete Account"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SERVICES */}
          {activeTab === 'services' && (
            <div className="tab-pane">
              <div className="services-list">
                <div className="service-item">
                  <div className="service-info">
                    <div className="service-badge-icon online">
                      <Cpu size={22} />
                    </div>
                    <div>
                      <h4>AI Safety Scorer Engine</h4>
                      <p>Python 3.12 / FastAPI (Uvicorn) / Random Forest Classifier with resilient fallback</p>
                      <span className="service-endpoint">Endpoint: {data?.services?.aiScoringEngine?.endpoint || 'http://127.0.0.1:8000'} &bull; Latency: {data?.services?.aiScoringEngine?.latencyMs ?? 15}ms</span>
                    </div>
                  </div>
                  <div className="service-status">
                    <span className="status-pill online">ONLINE & READY</span>
                  </div>
                </div>

                <div className="service-item">
                  <div className="service-info">
                    <div className="service-badge-icon online">
                      <Server size={22} />
                    </div>
                    <div>
                      <h4>SafeRoute API Gateway</h4>
                      <p>Node.js TypeScript / Express / Rate Limiting & JWT Auth</p>
                      <span className="service-endpoint">Port: {data?.services?.backend?.port || 5000} &bull; Environment: {data?.server?.environment || 'development'}</span>
                    </div>
                  </div>
                  <div className="service-status">
                    <span className="status-pill online">ONLINE</span>
                  </div>
                </div>

                <div className="service-item">
                  <div className="service-info">
                    <div className="service-badge-icon online">
                      <Database size={22} />
                    </div>
                    <div>
                      <h4>Data Persistence Layer</h4>
                      <p>{data?.services?.database?.engine || 'Dual-Layer In-Memory / MongoDB'}</p>
                      <span className="service-endpoint">Collections: Users, OtpTokens, RefreshSessions</span>
                    </div>
                  </div>
                  <div className="service-status">
                    <span className="status-pill online">CONNECTED</span>
                  </div>
                </div>

                <div className="service-item">
                  <div className="service-info">
                    <div className="service-badge-icon online">
                      <Bell size={22} />
                    </div>
                    <div>
                      <h4>Notification & OTP Mail Gateway</h4>
                      <p>{data?.services?.emailGateway?.provider || 'Ethereal Mail (Dev)'}</p>
                      <span className="service-endpoint">Cooldown: 60s &bull; Expiry: 10 mins &bull; 6-digit cryptographic OTP</span>
                    </div>
                  </div>
                  <div className="service-status">
                    <span className="status-pill online">OPERATIONAL</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI MODEL TESTER */}
          {activeTab === 'ai-model' && (
            <div className="tab-pane">
              <div className="ai-tester-layout">
                <div className="ai-controls-card">
                  <h4>Interactive Safety Model Probe</h4>
                  <p className="settings-desc">Run direct inference requests to the AI engine to evaluate safety predictions.</p>

                  <div className="slider-group">
                    <div className="slider-label">
                      <span>Street Lighting (0 to 10)</span>
                      <strong>{lighting}/10</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={lighting}
                      onChange={(e) => setLighting(Number(e.target.value))}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-label">
                      <span>Crime Risk Index (0 to 10)</span>
                      <strong>{crimeRisk}/10</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={crimeRisk}
                      onChange={(e) => setCrimeRisk(Number(e.target.value))}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-label">
                      <span>Accident Risk (0 to 10)</span>
                      <strong>{accidentRisk}/10</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={accidentRisk}
                      onChange={(e) => setAccidentRisk(Number(e.target.value))}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-label">
                      <span>Crowd Density (0 to 10)</span>
                      <strong>{crowdLevel}/10</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={crowdLevel}
                      onChange={(e) => setCrowdLevel(Number(e.target.value))}
                    />
                  </div>

                  <button
                    className="run-ai-btn"
                    onClick={handleRunAiTest}
                    disabled={aiTesting}
                  >
                    <Play size={16} />
                    {aiTesting ? 'Evaluating Scorer...' : 'Test AI Prediction'}
                  </button>
                </div>

                <div className="ai-result-panel">
                  <h4>Prediction Response Telemetry</h4>
                  {aiTestResult ? (
                    <div className="ai-score-display">
                      <div className="score-badge-circle">
                        <span className="big-score">{aiTestResult.safety_score}</span>
                        <span className="total-score">/100</span>
                      </div>
                      <div className="ai-metadata-list">
                        <div className="meta-item">
                          <span>Active Model:</span>
                          <strong>{aiTestResult.model}</strong>
                        </div>
                        <div className="meta-item">
                          <span>Data Classification:</span>
                          <strong>{aiTestResult.data_type}</strong>
                        </div>
                        <div className="meta-item">
                          <span>Safety Status:</span>
                          <strong className={aiTestResult.safety_score >= 70 ? 'positive' : 'caution'}>
                            {aiTestResult.safety_score >= 70 ? 'High Route Safety' : 'Moderate Caution Recommended'}
                          </strong>
                        </div>
                        {aiLatency !== null && (
                          <div className="meta-item">
                            <span>Inference Latency:</span>
                            <strong className="positive">{aiLatency} ms</strong>
                          </div>
                        )}
                        <p className="ai-warning-box">{aiTestResult.warning}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="ai-empty-state">
                      <Zap size={36} color="#94a3b8" />
                      <p>Adjust parameters and click "Test AI Prediction" to run live inference.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* TAB 5: SURFACE & RADAR TUNER */}
          {activeTab === 'surface-tuner' && (
            <div className="tab-pane">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 text-white mb-6 border border-slate-800 shadow-md">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white m-0">Surface & Radar Architecture Tuner</h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Admin Exclusive
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 m-0">
                    Tune GPU WebGL2 distance fields, reflection gloss, and designate the system-wide default preset for all visitors.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResetPresetDefaults}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Values</span>
                  </button>
                  <button
                    onClick={handleSaveAsSystemDefault}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Set as System Default</span>
                  </button>
                </div>
              </div>

              {tunerActionMessage && (
                <div className="admin-action-banner mb-4">
                  <Check size={16} />
                  <span>{tunerActionMessage}</span>
                </div>
              )}

              {/* Landing View Mode */}
              <div className="mb-6 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                      Landing View Mode
                    </label>
                    <p className="text-xs text-slate-500 m-0">
                      Sets the public landing experience. Hero View keeps the WebGL surface behind the hero; Full View extends it across the entire page.
                    </p>
                  </div>
                  <div className="inline-flex rounded-xl bg-slate-100 border border-slate-200 p-1 shrink-0">
                    <button
                      onClick={() => handleLandingViewChange(false)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        !landingFullView
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Hero View
                    </button>
                    <button
                      onClick={() => handleLandingViewChange(true)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        landingFullView
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Full View
                    </button>
                  </div>
                </div>
              </div>

              {/* Preset Selector */}
              <div className="mb-6">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-2">
                  System Presets & Corridors (Designate Default)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.values(PRESETS).map((p) => {
                    const isSelected = tunerPreset.id === p.id;
                    const isSystemDefault = savedDefaultId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setTunerPreset(p)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-slate-900 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/50'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.accentColor }} />
                          {isSystemDefault && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight">{p.name}</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.lighting} illumination</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Tuner Grid: Left Sliders, Right Live Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Sliders */}
                <div className="lg:col-span-7 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold m-0">
                      Live Parameters ({tunerPreset.name})
                    </h4>
                    <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                      {savedDefaultId === tunerPreset.id ? '★ System Default' : 'Custom Config'}
                    </span>
                  </div>

                  {([
                    { label: 'Tile Size', key: 'tileSize', min: 0.5, max: 2.0, step: 0.05 },
                    { label: 'Tile Spacing (Gap)', key: 'gap', min: 0.02, max: 0.3, step: 0.01 },
                    { label: 'Corner Roundness', key: 'roundness', min: 0.0, max: 0.5, step: 0.02 },
                    { label: 'Wave Dynamics', key: 'waves', min: 0.0, max: 1.5, step: 0.05 },
                    { label: 'Animation Velocity', key: 'speed', min: 0.1, max: 1.2, step: 0.05 },
                    { label: 'Specular Gloss', key: 'gloss', min: 0.1, max: 1.0, step: 0.05 },
                    { label: 'Perspective Tilt', key: 'tilt', min: 0.2, max: 1.0, step: 0.02 },
                    { label: 'Surface Grain', key: 'grain', min: 0.0, max: 0.2, step: 0.01 },
                  ] as const).map((ctrl) => {
                    const val = tunerPreset[ctrl.key];
                    return (
                      <div key={ctrl.key}>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="font-semibold text-slate-700">{ctrl.label}</span>
                          <span className="font-bold text-slate-900">{val.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={ctrl.min}
                          max={ctrl.max}
                          step={ctrl.step}
                          value={val}
                          onChange={(e) =>
                            setTunerPreset({ ...tunerPreset, [ctrl.key]: parseFloat(e.target.value) })
                          }
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-600 bg-slate-200"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Right: Live Interactive WebGL Preview */}
                <div className="lg:col-span-5 flex flex-col space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-700 uppercase tracking-wide">Interactive Radar Surface</span>
                    <span className="text-emerald-600 font-semibold">Direct WebGL2 Engine</span>
                  </div>
                  <div className="relative h-[360px] w-full rounded-2xl overflow-hidden border border-slate-300 shadow-xl bg-black">
                    <AcidSquares
                      color={tunerPreset.color}
                      accentColor={tunerPreset.accentColor}
                      secondaryColor={tunerPreset.secondaryColor}
                      lighting={tunerPreset.lighting}
                      tileSize={tunerPreset.tileSize}
                      gap={tunerPreset.gap}
                      roundness={tunerPreset.roundness}
                      softness={tunerPreset.softness}
                      bulge={tunerPreset.bulge}
                      rotation={tunerPreset.rotation}
                      gloss={tunerPreset.gloss}
                      waves={tunerPreset.waves}
                      waveScale={tunerPreset.waveScale}
                      speed={tunerPreset.speed}
                      tilt={tunerPreset.tilt}
                      grain={tunerPreset.grain}
                      shape={tunerPreset.shape}
                      hoverEffect={tunerPreset.hoverEffect}
                      mouseInteraction={true}
                      pulseOnClick={true}
                      detail="medium"
                      className="w-full h-full"
                    />
                    <div className="absolute bottom-3 left-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-center text-[10px] font-mono text-zinc-300 pointer-events-none">
                      Click to pulse shockwaves &bull; Hover to test pointer spring
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Active Default: {savedDefaultId === 'graphite' ? 'Titanium Monolith' : (PRESETS[savedDefaultId]?.name || savedDefaultId)}</span>
                      {savedDefaultId === tunerPreset.id && (
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          SYNCHRONIZED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500 m-0">
                      Selecting <strong>"Set as System Default"</strong> stores this preset and custom parameters as the public landing page default for all visitors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="admin-footer">
          <div className="admin-footer-info">
            <Shield size={14} /> SafeRoute Administration Console &bull; Security Level: High
          </div>
          {isStandalone && onLogout ? (
            <button className="admin-dismiss-btn" onClick={onLogout} style={{ background: '#ef4444', color: '#ffffff' }}>
              Sign Out
            </button>
          ) : onClose ? (
            <button className="admin-dismiss-btn" onClick={onClose}>
              Close Console
            </button>
          ) : null}
        </div>
      </div>
  );

  if (isStandalone) {
    return (
      <div className="admin-page-layout">
        {dashboardCard}
      </div>
    );
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      {dashboardCard}
    </div>
  );
};
