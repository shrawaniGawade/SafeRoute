import React, { useState, type ReactNode } from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useAiStatus } from '../../hooks/useAiStatus';
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
  const aiStatus = useAiStatus();
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
            <div
              className={`system-live-pill ${aiStatus.toLowerCase()}`}
              title={aiStatus === 'ONLINE' ? 'FastAPI Engine v1.0.0 Active' : 'FastAPI microservice unreachable — heuristic fallback active'}
            >
              <span className="live-dot" />
              <span>{aiStatus === 'ONLINE' ? 'AI Engine Online' : aiStatus === 'OFFLINE' ? 'AI Engine Offline' : 'Checking AI Engine'}</span>
            </div>

            <button
              type="button"
              className="user-quick-chip"
              onClick={() => onNavigate('profile')}
              title="View Profile"
            >
              <ShieldCheck size={16} color="#0d9488" />
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
