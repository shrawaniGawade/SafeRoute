import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { UserDashboard } from './components/UserDashboard';
import { RouteRecommendationPage } from './components/pages/RouteRecommendationPage';
import { PredictionDetailsPage } from './components/pages/PredictionDetailsPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { UnauthorizedPage } from './components/pages/UnauthorizedPage';
import { AppLayout } from './components/common/AppLayout';
import { AdminProvider } from './context/AdminContext';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminOverviewPage } from './components/admin/pages/AdminOverviewPage';
import { AdminUsersPage } from './components/admin/pages/AdminUsersPage';
import { AdminServicesPage } from './components/admin/pages/AdminServicesPage';
import { AdminAiSimulatorPage } from './components/admin/pages/AdminAiSimulatorPage';
import { Analytics } from '@vercel/analytics/react';

export type AppRoute =
  | 'login'
  | 'landing'
  | 'app'
  | 'routes'
  | 'prediction-details'
  | 'profile'
  | 'admin-overview'
  | 'admin-users'
  | 'admin-services'
  | 'admin-ai-simulator'
  | 'unauthorized'
  | 'not-found';

const ADMIN_EMAIL = 'admin@saferoute.com';

function App() {
  const { user, isAuthenticated, isLoading, setAuthModalView, logout, toastMessage, showToast } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('login');

  const isAdminRoute = (route: AppRoute): boolean =>
    route === 'admin-overview' ||
    route === 'admin-users' ||
    route === 'admin-services' ||
    route === 'admin-ai-simulator';

  const isUserRoute = (route: AppRoute): boolean =>
    route === 'app' ||
    route === 'routes' ||
    route === 'prediction-details' ||
    route === 'profile';

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

    // Admin Panel Routes
    if (hash.includes('admin/users') || path === '/admin/users') {
      return 'admin-users';
    }
    if (hash.includes('admin/services') || path === '/admin/services') {
      return 'admin-services';
    }
    if (hash.includes('admin/ai-simulator') || hash.includes('admin/simulator') || path === '/admin/ai-simulator') {
      return 'admin-ai-simulator';
    }
    if (
      hash.includes('admin/overview') ||
      hash === '#/admin' ||
      hash.startsWith('#/admin') ||
      path === '/admin' ||
      path.startsWith('/admin')
    ) {
      return 'admin-overview';
    }

    // User Panel Routes
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
        // Guests cannot access protected admin or user pages
        if (isAdminRoute(requestedRoute) || isUserRoute(requestedRoute)) {
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
        if (isAdminRoute(requestedRoute)) {
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
        const targetHash = `#/${requestedRoute}`;
        if (window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        }
        return;
      }

      // Logged-in Administrator
      if (user?.role === 'admin') {
        // Ensure only the seeded admin account can access admin features
        if (user.email !== ADMIN_EMAIL) {
          setCurrentRoute('unauthorized');
          window.location.hash = '#/unauthorized';
          showToast('Access restricted: Only the seeded administrator account is authorized.', 'error');
          return;
        }

        // Admins should see only admin features, not user-specific commuter features
        if (isUserRoute(requestedRoute) || requestedRoute === 'login') {
          setCurrentRoute('admin-overview');
          window.location.hash = '#/admin/overview';
          return;
        }

        if (requestedRoute === 'landing' || requestedRoute === 'not-found') {
          setCurrentRoute(requestedRoute);
          return;
        }

        if (isAdminRoute(requestedRoute)) {
          setCurrentRoute(requestedRoute);
          const adminPathMap: Record<string, string> = {
            'admin-overview': '#/admin/overview',
            'admin-users': '#/admin/users',
            'admin-services': '#/admin/services',
            'admin-ai-simulator': '#/admin/ai-simulator',
          };
          const targetHash = adminPathMap[requestedRoute] || '#/admin/overview';
          if (window.location.hash !== targetHash) {
            window.location.hash = targetHash;
          }
          return;
        }

        setCurrentRoute('admin-overview');
        if (window.location.hash !== '#/admin/overview') {
          window.location.hash = '#/admin/overview';
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

    if (user?.role === 'admin') {
      if (route === 'landing') {
        setCurrentRoute('landing');
        window.location.hash = '#/landing';
        return;
      }

      const adminPathMap: Record<string, AppRoute> = {
        admin: 'admin-overview',
        'admin-overview': 'admin-overview',
        'admin-users': 'admin-users',
        'admin-services': 'admin-services',
        'admin-ai-simulator': 'admin-ai-simulator',
      };

      const adminTarget = adminPathMap[route] || 'admin-overview';
      setCurrentRoute(adminTarget);
      const targetHash =
        adminTarget === 'admin-overview'
          ? '#/admin/overview'
          : adminTarget === 'admin-users'
          ? '#/admin/users'
          : adminTarget === 'admin-services'
          ? '#/admin/services'
          : '#/admin/ai-simulator';
      window.location.hash = targetHash;
      return;
    }

    if (route.startsWith('admin')) {
      // Regular users are barred from admin console
      setCurrentRoute('unauthorized');
      window.location.hash = '#/unauthorized';
      showToast('Access restricted: Admin privileges required.', 'error');
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
      case 'admin-overview':
        return 'System Telemetry & Platform Overview';
      case 'admin-users':
        return 'User Accounts Directory';
      case 'admin-services':
        return 'Microservices & Infrastructure Health';
      case 'admin-ai-simulator':
        return 'AI Safety Model Simulator';
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

      {/* 4. User Panel: User Dashboard */}
      {currentRoute === 'app' && (
        <AppLayout
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          pageTitle={getPageTitle(currentRoute)}
        >
          <UserDashboard
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        </AppLayout>
      )}

      {/* 5. User Panel: Route Recommendation Page */}
      {currentRoute === 'routes' && (
        <AppLayout
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          pageTitle={getPageTitle(currentRoute)}
        >
          <RouteRecommendationPage onNavigate={handleNavigate} />
        </AppLayout>
      )}

      {/* 6. User Panel: Prediction Details Page */}
      {currentRoute === 'prediction-details' && (
        <AppLayout
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          pageTitle={getPageTitle(currentRoute)}
        >
          <PredictionDetailsPage onNavigate={handleNavigate} />
        </AppLayout>
      )}

      {/* 7. User Panel: User Profile Page */}
      {currentRoute === 'profile' && (
        <AppLayout
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          pageTitle={getPageTitle(currentRoute)}
        >
          <ProfilePage />
        </AppLayout>
      )}

      {/* 8. Admin Panel: Dedicated Admin Layout & Pages */}
      {isAdminRoute(currentRoute) && user?.role === 'admin' && (
        <AdminProvider>
          <AdminLayout
            currentRoute={currentRoute}
            onNavigate={handleNavigate}
            pageTitle={getPageTitle(currentRoute)}
            onLogout={handleLogout}
          >
            {currentRoute === 'admin-overview' && (
              <AdminOverviewPage onNavigate={handleNavigate} />
            )}
            {currentRoute === 'admin-users' && <AdminUsersPage />}
            {currentRoute === 'admin-services' && <AdminServicesPage />}
            {currentRoute === 'admin-ai-simulator' && <AdminAiSimulatorPage />}
          </AdminLayout>
        </AdminProvider>
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
