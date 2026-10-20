import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { RouteRecommendationPage } from './components/pages/RouteRecommendationPage';
import { PredictionDetailsPage } from './components/pages/PredictionDetailsPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { UnauthorizedPage } from './components/pages/UnauthorizedPage';
import { AppLayout } from './components/common/AppLayout';
import { Analytics } from '@vercel/analytics/react';

export type AppRoute =
  | 'login'
  | 'landing'
  | 'app'
  | 'routes'
  | 'prediction-details'
  | 'profile'
  | 'admin'
  | 'unauthorized'
  | 'not-found';

function App() {
  const { user, isAuthenticated, isLoading, setAuthModalView, logout, toastMessage, showToast } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('login');

  // Parse path or hash into an AppRoute
  const getRequestedRoute = useCallback((): AppRoute => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    if (hash.includes('register')) {
      setAuthModalView('register');
      return 'login';
    }
    if (hash.includes('login') || hash.includes('signin')) {
      setAuthModalView('login');
      return 'login';
    }
    if (hash.includes('unauthorized') || path === '/unauthorized') {
      return 'unauthorized';
    }
    if (hash.includes('not-found') || hash.includes('404') || path === '/404') {
      return 'not-found';
    }
    if (hash.includes('admin') || path === '/admin' || path.startsWith('/admin')) {
      return 'admin';
    }
    if (hash.includes('prediction-details') || hash.includes('audit') || hash.includes('details')) {
      return 'prediction-details';
    }
    if (hash.includes('routes') || hash.includes('recommendation') || hash.includes('planner')) {
      return 'routes';
    }
    if (hash.includes('profile') || hash.includes('account') || hash.includes('settings')) {
      return 'profile';
    }
    if (hash.includes('app') || hash.includes('dashboard') || path === '/app' || path.startsWith('/app')) {
      return 'app';
    }
    if (hash.includes('landing') || hash.includes('about') || hash.includes('features') || path === '/landing' || path.startsWith('/landing')) {
      return 'landing';
    }

    // Default route for visitors is login
    return 'login';
  }, [setAuthModalView]);

  // Synchronize route and enforce RBAC route protection
  const syncRouteWithProtection = useCallback(
    (requestedRoute: AppRoute) => {
      if (isLoading) return;

      if (!isAuthenticated) {
        // Guests cannot access protected pages
        if (
          requestedRoute === 'admin' ||
          requestedRoute === 'app' ||
          requestedRoute === 'routes' ||
          requestedRoute === 'prediction-details' ||
          requestedRoute === 'profile'
        ) {
          setCurrentRoute('login');
          window.location.hash = '#/login';
          showToast('Please sign in to access SafeRoute.', 'info');
          return;
        }

        // Guests can view public pages
        if (requestedRoute === 'landing' || requestedRoute === 'not-found' || requestedRoute === 'unauthorized') {
          setCurrentRoute(requestedRoute);
          return;
        }

        // New visitors land on Login Page
        setCurrentRoute('login');
        return;
      }

      // Logged-in Standard User
      if (user?.role === 'user') {
        if (requestedRoute === 'admin') {
          // Standard user attempted to access admin page
          setCurrentRoute('unauthorized');
          window.location.hash = '#/unauthorized';
          showToast('Access restricted: Admin privileges required.', 'error');
          return;
        }

        // If user lands on login page while already authenticated, redirect to dashboard
        if (requestedRoute === 'login') {
          setCurrentRoute('app');
          window.location.hash = '#/app';
          return;
        }

        setCurrentRoute(requestedRoute);
        if (window.location.hash !== `#/${requestedRoute}`) {
          window.location.hash = `#/${requestedRoute}`;
        }
        return;
      }

      // Logged-in Administrator
      if (user?.role === 'admin') {
        // If admin lands on login page while already authenticated, redirect to admin console
        if (requestedRoute === 'login') {
          setCurrentRoute('admin');
          window.location.hash = '#/admin';
          return;
        }

        setCurrentRoute(requestedRoute);
        if (window.location.hash !== `#/${requestedRoute}`) {
          window.location.hash = `#/${requestedRoute}`;
        }
        return;
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

  // Unified Navigation Handler
  const handleNavigate = (route: string) => {
    if (route === 'landing') {
      setCurrentRoute('landing');
      window.location.hash = '#/landing';
      return;
    }

    if (route === 'login' || route === 'register') {
      setAuthModalView(route === 'register' ? 'register' : 'login');
      setCurrentRoute('login');
      window.location.hash = `#/${route}`;
      return;
    }

    if (route === 'admin') {
      if (user?.role === 'admin') {
        setCurrentRoute('admin');
        window.location.hash = '#/admin';
      } else {
        setCurrentRoute('unauthorized');
        window.location.hash = '#/unauthorized';
      }
      return;
    }

    if (!isAuthenticated) {
      setCurrentRoute('login');
      window.location.hash = '#/login';
      showToast('Please sign in to access this page.', 'info');
      return;
    }

    const validRoutes: AppRoute[] = [
      'app',
      'routes',
      'prediction-details',
      'profile',
      'admin',
      'unauthorized',
      'not-found',
    ];

    if (validRoutes.includes(route as AppRoute)) {
      setCurrentRoute(route as AppRoute);
      window.location.hash = `#/${route}`;
    } else {
      setCurrentRoute('not-found');
      window.location.hash = '#/not-found';
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentRoute('login');
    window.location.hash = '#/login';
  };

  const getPageTitle = (route: AppRoute): string => {
    switch (route) {
      case 'app':
        return 'Traveler Dashboard';
      case 'routes':
        return 'AI Route Safety Finder';
      case 'prediction-details':
        return 'Safety Inference Audit';
      case 'profile':
        return 'My Account & Preferences';
      case 'unauthorized':
        return 'Clearance Required';
      case 'not-found':
        return 'Route Not Found (404)';
      default:
        return 'SafeRoute AI Navigation';
    }
  };

  return (
    <>
      {/* Global Toast Notification */}
      {toastMessage && (
        <aside className={`toast-notification ${toastMessage.type}`} role="status">
          <span>{toastMessage.text}</span>
        </aside>
      )}

      {/* 1. Public Landing Page */}
      {currentRoute === 'landing' && (
        <LandingPage
          onSignIn={() => handleNavigate('login')}
          onSignUp={() => handleNavigate('register')}
        />
      )}

      {/* 2 & 3. Login & Registration Page */}
      {currentRoute === 'login' && (
        <LoginPage onExploreLanding={() => handleNavigate('landing')} />
      )}

      {/* 4. User Dashboard */}
      {currentRoute === 'app' && (
        <AppLayout
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          pageTitle={getPageTitle(currentRoute)}
        >
          <UserDashboard
            onNavigate={handleNavigate}
            onOpenAdmin={user?.role === 'admin' ? () => handleNavigate('admin') : undefined}
            onLogout={handleLogout}
          />
        </AppLayout>
      )}

      {/* 5. Route Recommendation Page */}
      {currentRoute === 'routes' && (
        <AppLayout
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          pageTitle={getPageTitle(currentRoute)}
        >
          <RouteRecommendationPage onNavigate={handleNavigate} />
        </AppLayout>
      )}

      {/* 6. Prediction Details Page */}
      {currentRoute === 'prediction-details' && (
        <AppLayout
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          pageTitle={getPageTitle(currentRoute)}
        >
          <PredictionDetailsPage onNavigate={handleNavigate} />
        </AppLayout>
      )}

      {/* 7. User Profile Page */}
      {currentRoute === 'profile' && (
        <AppLayout
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          pageTitle={getPageTitle(currentRoute)}
        >
          <ProfilePage />
        </AppLayout>
      )}

      {/* 8. Admin Dashboard */}
      {currentRoute === 'admin' && (
        <AdminDashboard
          isOpen={true}
          isStandalone={true}
          onLogout={handleLogout}
          onGoToPlanner={() => handleNavigate('routes')}
        />
      )}

      {/* 9a. Unauthorized (403) Page */}
      {currentRoute === 'unauthorized' && (
        isAuthenticated ? (
          <AppLayout
            currentRoute={currentRoute}
            onNavigate={handleNavigate}
            pageTitle={getPageTitle(currentRoute)}
          >
            <UnauthorizedPage onNavigate={handleNavigate} onLogout={handleLogout} />
          </AppLayout>
        ) : (
          <UnauthorizedPage onNavigate={handleNavigate} onLogout={handleLogout} />
        )
      )}

      {/* 9b. Not Found (404) Page */}
      {currentRoute === 'not-found' && (
        isAuthenticated ? (
          <AppLayout
            currentRoute={currentRoute}
            onNavigate={handleNavigate}
            pageTitle={getPageTitle(currentRoute)}
          >
            <NotFoundPage onNavigate={handleNavigate} />
          </AppLayout>
        ) : (
          <NotFoundPage onNavigate={handleNavigate} />
        )
      )}

      {/* Authentication Modal */}
      <AuthModal />

      {/* Vercel Telemetry Analytics */}
      <Analytics />
    </>
  );
}

export default App;
