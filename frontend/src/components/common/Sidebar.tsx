import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  MapPin,
  FileText,
  User,
  LogOut,
  Shield,
  Compass,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const handleLinkClick = (route: string) => {
    onNavigate(route);
    onCloseMobile();
  };

  const handleLogoutClick = async () => {
    onCloseMobile();
    await logout();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`mobile-drawer-backdrop ${isMobileOpen ? 'mobile-open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* Main Sidebar Element */}
      <aside
        className={`sidebar-container ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Application Navigation"
      >
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => handleLinkClick('app')}>
            <div className="sidebar-logo-icon">
              <Shield size={22} />
            </div>
            <div>
              <span className="sidebar-brand-title">SafeRoute</span>
              <span className="sidebar-brand-sub">AI Navigation</span>
            </div>
          </div>

          <button
            type="button"
            className="mobile-close-btn"
            onClick={onCloseMobile}
            style={{
              display: isMobileOpen ? 'flex' : 'none',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-title">Navigation</span>

          <button
            type="button"
            id="user-nav-dashboard"
            className={`sidebar-nav-link ${currentRoute === 'app' ? 'active' : ''}`}
            onClick={() => handleLinkClick('app')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            id="user-nav-routes"
            className={`sidebar-nav-link ${currentRoute === 'routes' ? 'active' : ''}`}
            onClick={() => handleLinkClick('routes')}
          >
            <MapPin size={18} />
            <span>Route Finder</span>
            <span className="sidebar-badge">AI Map</span>
          </button>

          <button
            type="button"
            id="user-nav-audit"
            className={`sidebar-nav-link ${currentRoute === 'prediction-details' ? 'active' : ''}`}
            onClick={() => handleLinkClick('prediction-details')}
          >
            <FileText size={18} />
            <span>Prediction Audit</span>
          </button>

          <button
            type="button"
            id="user-nav-profile"
            className={`sidebar-nav-link ${currentRoute === 'profile' ? 'active' : ''}`}
            onClick={() => handleLinkClick('profile')}
          >
            <User size={18} />
            <span>My Profile</span>
          </button>

          {user?.role === 'admin' && (
            <button
              type="button"
              id="user-nav-admin"
              className={`sidebar-nav-link ${currentRoute === 'admin' ? 'active' : ''}`}
              onClick={() => handleLinkClick('admin')}
            >
              <Shield size={18} />
              <span>Admin Console</span>
              <span className="sidebar-badge admin">Admin</span>
            </button>
          )}

          <span className="sidebar-section-title">Platform</span>

          <button
            type="button"
            id="user-nav-landing"
            className={`sidebar-nav-link ${currentRoute === 'landing' ? 'active' : ''}`}
            onClick={() => handleLinkClick('landing')}
          >
            <Compass size={18} />
            <span>Public Overview</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="sidebar-user-meta">
              <div className="sidebar-user-name">{user?.name || 'Commuter'}</div>
              <div className="sidebar-user-role">{user?.role || 'User'}</div>
            </div>
          </div>

          <button
            type="button"
            id="user-logout-btn"
            className="sidebar-logout-btn"
            onClick={handleLogoutClick}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
