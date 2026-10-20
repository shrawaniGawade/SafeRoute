import React from 'react';
import './RouteCardSkeleton.css';

export interface RouteCardSkeletonProps {
  count?: number;
  className?: string;
}

export const RouteCardSkeleton: React.FC<RouteCardSkeletonProps> = ({
  count = 3,
  className = '',
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div
      className={`route-skeleton-stack ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading route recommendations and safety factors"
    >
      <span className="sr-only">Evaluating safe routes...</span>
      {items.map((idx) => (
        <div key={`route-skeleton-${idx}`} className="route-card-skeleton">
          {/* Header Row */}
          <div className="skeleton-header">
            <div className="skeleton-badge-cluster">
              <div className="skeleton-block skeleton-letter" />
              {idx === 0 && <div className="skeleton-block skeleton-recommended" />}
            </div>
            <div className="skeleton-block skeleton-risk-pill" />
          </div>

          {/* Card Body */}
          <div className="skeleton-body">
            <div className="skeleton-block skeleton-icon-box" />
            <div className="skeleton-info-group">
              <div
                className="skeleton-block skeleton-title-line"
                style={{ width: idx === 0 ? '75%' : idx === 1 ? '65%' : '80%' }}
              />
              <div
                className="skeleton-block skeleton-summary-line"
                style={{ width: idx === 0 ? '90%' : idx === 1 ? '85%' : '78%' }}
              />
            </div>
            <div className="skeleton-block skeleton-score-badge" />
          </div>

          {/* Metrics Row */}
          <div className="skeleton-metrics-bar">
            <div className="skeleton-block skeleton-metric-chip" style={{ width: '70px' }} />
            <div className="skeleton-block skeleton-metric-chip" style={{ width: '65px' }} />
            <div className="skeleton-block skeleton-metric-chip" style={{ width: '80px' }} />
          </div>

          {/* Attributes row */}
          <div className="skeleton-attributes-row">
            <div className="skeleton-block skeleton-attr-pill" style={{ width: '130px' }} />
            <div className="skeleton-block skeleton-attr-pill" style={{ width: '110px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};
