import React from 'react';
import { Info, Layers } from 'lucide-react';
import { RouteCard } from './RouteCard';
import type { RouteAlternativeItem } from '../../services/api';
import './RouteCard.css';

export interface RouteListProps {
  routes?: RouteAlternativeItem[];
  selectedRouteId: string;
  onSelectRoute: (routeId: string) => void;
  onNavigateDetails?: (routeId: string) => void;
  className?: string;
}

export const RouteList: React.FC<RouteListProps> = ({
  routes = [],
  selectedRouteId,
  onSelectRoute,
  onNavigateDetails,
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
        <span className="route-count-badge">
          {routes.length} {routes.length === 1 ? 'Route Evaluated' : 'Routes Available'}
        </span>
      </div>

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
    </div>
  );
};
