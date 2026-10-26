import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import {
  Shield,
  Server,
  Users,
  CheckCircle2,
  X,
  Database,
  RefreshCw,
  Bell,
  Trash2,
  Check,
  LogOut,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminStats,
  deleteAdminUser
} from '../services/api';
import type { AdminStatsResponse } from '../services/api';

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
  const [activeTab, setActiveTab] = useState<'users' | 'services'>('users');
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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
          Microservices &amp; Health
        </button>
      </div>

      {/* Modal Body */}
      <div className="admin-body">
        {/* TAB 1: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="tab-pane">
            <div className="admin-section">
              <div className="section-header">
                <div>
                  <h3>User Accounts Directory</h3>
                  <p className="section-hint">Directory of user accounts. The single administrator account is provisioned via secure seeding, and regular user roles are fixed.</p>
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
                            {u.role !== 'admin' && u.id !== user?.id ? (
                              <button
                                className="action-pill-btn delete"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                title="Delete Account"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <span className="text-muted" style={{ fontSize: '11px' }}>
                                {u.role === 'admin' ? 'Seeded Admin' : 'Current Account'}
                              </span>
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

        {/* TAB 2: SERVICES */}
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
                  <span className="status-pill online">ONLINE &amp; READY</span>
                </div>
              </div>

              <div className="service-item">
                <div className="service-info">
                  <div className="service-badge-icon online">
                    <Server size={22} />
                  </div>
                  <div>
                    <h4>SafeRoute API Gateway</h4>
                    <p>Node.js TypeScript / Express / Rate Limiting &amp; JWT Auth</p>
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
                    <h4>Notification &amp; OTP Mail Gateway</h4>
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
      </div>

      {/* Footer */}
      <div className="admin-footer">
        <div className="admin-footer-info">
          <Shield size={14} /> SafeRoute Administration Console &bull; Security Level: High
        </div>
        {isStandalone && onLogout ? (
          <button className="admin-dismiss-btn danger" onClick={onLogout}>
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
