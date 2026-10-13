import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Analytics } from '@vercel/analytics/react';

export type AppRoute = 'login' | 'landing' | 'app' | 'admin';

function App() {
  const { user, isAuthenticated, isLoading, setAuthModalView, logout, toastMessage, showToast } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('login');

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
    if (hash.includes('landing') || hash.includes('about') || hash.includes('features') || path === '/landing' || path.startsWith('/landing')) {
      return 'landing';
    }
    // Default route for visitors is login
    return 'login';
  }, []);

  // Synchronize route and enforce RBAC route protection
  const syncRouteWithProtection = useCallback(
    (requestedRoute: AppRoute) => {
      if (isLoading) return;

      if (!isAuthenticated) {
        // Guests cannot access protected pages
        if (requestedRoute === 'admin' || requestedRoute === 'app') {
          setCurrentRoute('login');
          window.location.hash = '#/login';
          showToast('Please sign in to access SafeRoute.', 'info');
          return;
        }

        // Guests can view landing page if explicitly navigated
        if (requestedRoute === 'landing') {
          setCurrentRoute('landing');
          return;
        }

        // New visitors and unauthenticated users land directly on the Login Page
        setCurrentRoute('login');
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
        // User lands on route planner
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
    [isAuthenticated, isLoading, user, showToast]
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

  const handleGoToLanding = () => {
    setCurrentRoute('landing');
    window.location.hash = '#/landing';
  };

  const handleGoToLogin = (view: 'login' | 'register' = 'login') => {
    setAuthModalView(view);
    setCurrentRoute('login');
    window.location.hash = '#/login';
  };

  const handleLogout = async () => {
    await logout();
    setCurrentRoute('login');
    window.location.hash = '#/login';
  };

  return (
    <>
      {/* Global Toast Notification */}
      {toastMessage && (
        <aside className={`toast-notification ${toastMessage.type}`} role="status">
          <span>{toastMessage.text}</span>
        </aside>
      )}

      {/* Screen 1: Primary Login & Registration Page (Default for new users / visitors) */}
      {currentRoute === 'login' && (
        <LoginPage onExploreLanding={handleGoToLanding} />
      )}

      {/* Screen 2: Public Landing Page & Features Showcase */}
      {currentRoute === 'landing' && (
        <LandingPage
          onSignIn={() => handleGoToLogin('login')}
          onSignUp={() => handleGoToLogin('register')}
        />
      )}

      {/* Screen 3: Logged-in User Application (Route Safety Planner) */}
      {currentRoute === 'app' && (
        <UserDashboard
          onOpenAdmin={user?.role === 'admin' ? handleOpenAdminFromPlanner : undefined}
          onLogout={handleLogout}
        />
      )}

      {/* Screen 4: Logged-in Admin Command Center */}
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

      {/* Authentication Modal (Available for modal interactions if triggered) */}
      <AuthModal />

      {/* Vercel Telemetry Analytics */}
      <Analytics />
    </>
  );
}

export default App;
