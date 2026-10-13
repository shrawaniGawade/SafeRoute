import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { LandingPage } from './components/LandingPage';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Analytics } from '@vercel/analytics/react';

export type AppRoute = 'landing' | 'app' | 'admin';

function App() {
  const { user, isAuthenticated, isLoading, openAuthModal, logout, toastMessage, showToast } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('landing');

  // Parse path or hash into an AppRoute
  const getRequestedRoute = useCallback((): AppRoute => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    if (hash.includes('admin') || path === '/admin' || path.startsWith('/admin')) {
      return 'admin';
    }
    if (hash.includes('app') || hash.includes('planner') || path === '/app' || path.startsWith('/app')) {
      return 'app';
    }
    return 'landing';
  }, []);

  // Synchronize route and enforce RBAC route protection
  const syncRouteWithProtection = useCallback(
    (requestedRoute: AppRoute) => {
      if (isLoading) return;

      if (!isAuthenticated) {
        // Guests cannot access protected pages
        if (requestedRoute === 'admin' || requestedRoute === 'app') {
          setCurrentRoute('landing');
          window.location.hash = '#/';
          openAuthModal('login');
          showToast('Please sign in to access SafeRoute.', 'info');
          return;
        }
        setCurrentRoute('landing');
        return;
      }

      // Logged-in user checks
      if (user?.role === 'user') {
        if (requestedRoute === 'admin') {
          // Standard user attempted to access admin page
          setCurrentRoute('app');
          window.location.hash = '#/app';
          showToast('Access restricted: Admin privileges required.', 'error');
          return;
        }
        // User on landing or app -> goes to user app
        setCurrentRoute('app');
        if (window.location.hash !== '#/app') {
          window.location.hash = '#/app';
        }
        return;
      }

      if (user?.role === 'admin') {
        // Admin can access both admin and app (route planner)
        if (requestedRoute === 'app') {
          setCurrentRoute('app');
          window.location.hash = '#/app';
        } else {
          setCurrentRoute('admin');
          if (window.location.hash !== '#/admin') {
            window.location.hash = '#/admin';
          }
        }
      }
    },
    [isAuthenticated, isLoading, user, openAuthModal, showToast]
  );

  // Sync on initial load and whenever authentication status changes
  useEffect(() => {
    const requested = getRequestedRoute();
    syncRouteWithProtection(requested);
  }, [isAuthenticated, isLoading, user, getRequestedRoute, syncRouteWithProtection]);

  // Listen to browser back/forward and hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      const requested = getRequestedRoute();
      syncRouteWithProtection(requested);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [getRequestedRoute, syncRouteWithProtection]);

  // Navigation handlers
  const handleOpenAdminFromPlanner = () => {
    if (user?.role === 'admin') {
      setCurrentRoute('admin');
      window.location.hash = '#/admin';
    } else {
      showToast('Admin privileges required to access the Admin Console.', 'error');
    }
  };

  const handleOpenPlannerFromAdmin = () => {
    setCurrentRoute('app');
    window.location.hash = '#/app';
  };

  const handleCloseAdmin = () => {
    setCurrentRoute('app');
    window.location.hash = '#/app';
  };

  const handleLogout = async () => {
    await logout();
    setCurrentRoute('landing');
    window.location.hash = '#/';
  };

  return (
    <>
      {/* Global Toast Notification */}
      {toastMessage && (
        <aside className={`toast-notification ${toastMessage.type}`} role="status">
          <span>{toastMessage.text}</span>
        </aside>
      )}

      {/* Screen 1: Public Landing Page (Unauthenticated / Default) */}
      {currentRoute === 'landing' && (
        <LandingPage
          onSignIn={() => openAuthModal('login')}
          onSignUp={() => openAuthModal('register')}
        />
      )}

      {/* Screen 2: Logged-in User Application (Route Safety Planner) */}
      {currentRoute === 'app' && (
        <UserDashboard
          onOpenAdmin={user?.role === 'admin' ? handleOpenAdminFromPlanner : undefined}
          onLogout={handleLogout}
        />
      )}

      {/* Screen 3: Logged-in Admin Command Center */}
      {currentRoute === 'admin' && (
        <>
          <UserDashboard
            onOpenAdmin={handleOpenAdminFromPlanner}
            onLogout={handleLogout}
          />
          <AdminDashboard
            isOpen={true}
            onClose={handleCloseAdmin}
            onGoToPlanner={handleOpenPlannerFromAdmin}
          />
        </>
      )}

      {/* Authentication Modal */}
      <AuthModal />

      {/* Vercel Telemetry Analytics */}
      <Analytics />
    </>
  );
}

export default App;
