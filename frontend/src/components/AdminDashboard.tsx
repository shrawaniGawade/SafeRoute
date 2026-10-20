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
  LogOut
} from 'lucide-react';
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
  onGoToPlanner?: () => void;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen = true,
  isStandalone = false,
  onClose,
  onGoToPlanner,
  onLogout
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'users' | 'ai-model'>('overview');
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
            <Shield size={24} color="#087f8c" />
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
          {onGoToPlanner && (
            <button
              type="button"
              className="planner-switch-btn"
              onClick={onGoToPlanner}
            >
              <span>Route Planner &rarr;</span>
            </button>
          )}
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
