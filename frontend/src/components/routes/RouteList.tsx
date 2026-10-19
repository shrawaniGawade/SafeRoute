import React from 'react';
import { Info, Layers, Compass, MapPinOff } from 'lucide-react';
import { RouteCard } from './RouteCard';
import { RouteCardSkeleton } from './RouteCardSkeleton';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import type { RouteAlternativeItem } from '../../services/api';
import './RouteCard.css';

export interface RouteListProps {
  routes?: RouteAlternativeItem[];
  selectedRouteId?: string;
  onSelectRoute: (routeId: string) => void;
  onNavigateDetails?: (routeId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  errorStatus?: number | null;
  onRetry?: () => void;
  hasSearched?: boolean;
  onUseDemoLocations?: () => void;
  className?: string;
}

export const RouteList: React.FC<RouteListProps> = ({
  routes = [],
  selectedRouteId,
  onSelectRoute,
  onNavigateDetails,
  isLoading = false,
  error = null,
  errorStatus = null,
  onRetry,
  hasSearched = true,
  onUseDemoLocations,
  className = '',
}) => {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const isSingleRoute = routes.length === 1;

  return (
    <div className={`routes-container-panel ${className}`} role="region" aria-label="Route Alternatives List">
      {/* Header bar */}
      <div className="routes-list-header">
        <div className="routes-header-title">
          <Layers size={18} className="header-icon" />
          <h3>Route Alternatives</h3>
        </div>
        {isLoading ? (
          <span className="route-count-badge" style={{ animation: 'sr-skeleton-pulse 1.5s infinite' }}>
            Evaluating...
          </span>
        ) : error ? (
          <span className="route-count-badge" style={{ color: '#b91c1c', borderColor: '#fecaca' }}>
            Search Error
          </span>
        ) : !hasSearched && routes.length === 0 ? (
          <span className="route-count-badge">Ready</span>
        ) : (
          <span className="route-count-badge">
            {routes.length} {routes.length === 1 ? 'Route Evaluated' : 'Routes Available'}
          </span>
        )}
      </div>

      {/* 1. Loading State: Skeleton Cards (ISSUE-11 Task 1) */}
      {isLoading ? (
        <RouteCardSkeleton count={3} />
      ) : error ? (
        /* 2. Error State with Retry Button (ISSUE-11 Task 3) */
        <ErrorState
          message={error}
          statusCode={errorStatus}
          onRetry={onRetry}
          retryLabel="Retry Search"
        />
      ) : !hasSearched && routes.length === 0 ? (
        /* 3. Before Any Search: Friendly Hint (ISSUE-11 Workflow) */
        <EmptyState
          icon={<Compass size={28} />}
          title="Compare Safe Routes"
          description="Enter a start and destination to compare routes."
          hint="SafeRoute analyzes streetlighting, historical crime density, and foot traffic across urban corridors."
          actionLabel={onUseDemoLocations ? 'Load Demo Route' : undefined}
          onAction={onUseDemoLocations}
        />
      ) : hasSearched && routes.length === 0 ? (
        /* 4. No Route Found (ISSUE-11 / 404 Empty State) */
        <EmptyState
          icon={<MapPinOff size={28} />}
          title="No route available between these points."
          description="No navigable pedestrian or transit corridors could be mapped between these coordinates. Please try adjusting your locations to nearby avenues or landmarks."
          actionLabel={onUseDemoLocations ? 'Try Demo Locations' : undefined}
          onAction={onUseDemoLocations}
        />
      ) : (
        /* 5. Routes Evaluated */
        <>
          {/* Single-route fallback notice: AC: Given only 1 route is returned, then I see a note: "Provider returned one route." */}
          {isSingleRoute && (
            <div className="single-route-notice" role="status" aria-live="polite">
              <div className="notice-icon-box">
                <Info size={16} />
              </div>
              <div className="notice-text-content">
                <strong>Provider returned one route.</strong>
                <span>Direct or alternative navigable corridors are currently constrained for this specific pair of coordinates.</span>
              </div>
            </div>
          )}

          {/* List of Route Cards (Sidebar on desktop, bottom sheet / scroll deck on mobile) */}
          <div className="route-cards-stack">
            {routes.map((route, index) => {
              const letter = route.letter || letters[index] || String(index + 1);
              const isSelected = route.id === selectedRouteId;

              return (
                <RouteCard
                  key={route.id || `route-${index}`}
                  route={route}
                  letter={letter}
                  isSelected={isSelected}
                  onSelect={onSelectRoute}
                  onNavigateDetails={onNavigateDetails}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
