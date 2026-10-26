import React from 'react';
import {
  ShieldCheck,
  Navigation,
  Compass,
  Clock,
  MapPin,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { ScoreBadge } from '../common/ScoreBadge';
import type { RouteAlternativeItem } from '../../services/api';

export interface RouteCardProps {
  route: RouteAlternativeItem;
  letter: string;
  isSelected: boolean;
  onSelect: (routeId: string) => void;
}

/**
 * Returns a human-readable explicit risk text label so risk is never indicated by color alone.
 */
export function getExplicitRiskLabel(score: number, rating?: string): {
  label: string;
  badgeClass: string;
  description: string;
} {
  if (score >= 80) {
    return {
      label: rating || 'Optimal Safety (Low Risk)',
      badgeClass: 'risk-optimal',
      description: 'Illuminated & active corridor',
    };
  }
  if (score >= 55) {
    return {
      label: rating || 'Moderate Caution (Balanced)',
      badgeClass: 'risk-moderate',
      description: 'Standard commuter awareness',
    };
  }
  return {
    label: rating || 'Elevated Risk (Dark Zones)',
    badgeClass: 'risk-elevated',
    description: 'Reduced lighting / isolated segments',
  };
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  letter,
  isSelected,
  onSelect,
}) => {
  const riskMeta = getExplicitRiskLabel(route.safety_score, route.rating);
  const routeColor = route.color || (letter === 'A' ? '#0d9488' : letter === 'B' ? '#8b5cf6' : '#f59e0b');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(route.id);
    }
  };

  const getRouteIcon = () => {
    if (route.isRecommended || letter === 'A') {
      return <ShieldCheck size={20} className="route-type-icon safe" />;
    }
    if (letter === 'B') {
      return <Compass size={20} className="route-type-icon balanced" />;
    }
    return <Navigation size={20} className="route-type-icon shortcut" />;
  };

  return (
    <div
      className={`route-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(route.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`Route ${letter}: ${route.name}. Safety score ${route.safety_score} out of 100, risk classification: ${riskMeta.label}`}
      style={{
        '--route-accent': routeColor,
      } as React.CSSProperties}
    >
      {/* Top Banner / Badge Row */}
      <div className="route-card-header">
        <div className="route-badge-cluster">
          <span className="route-letter-tag" style={{ backgroundColor: routeColor }}>
            Route {letter}
          </span>
          {route.isRecommended && (
            <span className="route-recommended-tag">
              <Sparkles size={12} />
              <span>Recommended Pick</span>
            </span>
          )}
        </div>

        {/* Explicit Risk Text Badge (Accessibility requirement) */}
        <div className="risk-text-cluster">
          <span className={`risk-text-pill ${riskMeta.badgeClass}`}>
            {riskMeta.label}
          </span>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="route-card-body">
        <div className="route-icon-box">
          {getRouteIcon()}
        </div>

        <div className="route-info-group">
          <h3 className="route-title">{route.name}</h3>
          <p className="route-summary">{route.summary}</p>
        </div>

        <div className="route-score-cluster">
          <ScoreBadge score={route.safety_score} size="md" />
        </div>
      </div>

      {/* Metrics Row: ETA, Distance, & Lighting */}
      <div className="route-metrics-bar">
        <div className="metric-item">
          <Clock size={13} />
          <span className="metric-label">ETA:</span>
          <strong className="metric-value">{route.durationText}</strong>
        </div>

        <div className="metric-separator">&bull;</div>

        <div className="metric-item">
          <MapPin size={13} />
          <span className="metric-label">Dist:</span>
          <strong className="metric-value">{route.distanceText}</strong>
        </div>

        {route.factors && (
          <>
            <div className="metric-separator">&bull;</div>
            <div className="metric-item">
              <span className="metric-label">Illumination:</span>
              <strong className="metric-value">{route.factors.lighting}/10</strong>
            </div>
          </>
        )}
      </div>

      {/* Recommendation Reason Callout (FRD F3.4 / ISSUE-14) */}
      {route.isRecommended && route.recommendationReason && (
        <div className="route-recommendation-reason-strip" role="status">
          <Sparkles size={12} className="recommendation-sparkle-icon" />
          <span>{route.recommendationReason}</span>
        </div>
      )}

      {/* Caveat or Highlight strip if present */}
      {route.caveats && route.caveats.length > 0 && !route.isRecommended && (
        <div className="route-caution-strip">
          <AlertTriangle size={12} />
          <span>{route.caveats[0]}</span>
        </div>
      )}

      {/* Card Footer: Selection indicator */}
      <div className="route-card-footer">
        <div className="selection-status">
          <span className={`status-indicator ${isSelected ? 'active' : ''}`} />
          <span className="status-text">{isSelected ? 'Active on Map' : 'Click to Highlight'}</span>
        </div>
      </div>
    </div>
  );
};
