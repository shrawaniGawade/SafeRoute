import React, { useState, type ReactNode } from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import './AppLayout.css';

interface AppLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  pageTitle: string;
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentRoute,
  onNavigate,
  pageTitle,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="app-shell-root">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="app-shell-main">
        {/* Top App Bar */}
        <header className="app-topbar">
          <div className="app-topbar-left">
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="app-page-heading">{pageTitle}</h1>
          </div>

          <div className="app-topbar-right">
            <div className="system-live-pill" title="FastAPI Engine v1.0.0 Active">
              <span className="live-dot" />
              <span>AI Engine Online</span>
            </div>

            <button
              type="button"
              className="user-quick-chip"
              onClick={() => onNavigate('profile')}
              title="View Profile"
            >
              <ShieldCheck size={16} color="#087f8c" />
              <span>{user?.name || 'My Account'}</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="app-content-body">
          {children}
        </main>
      </div>
    </div>
  );
};
