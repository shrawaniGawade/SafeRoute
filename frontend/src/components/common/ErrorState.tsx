import React from 'react';
import { AlertTriangle, Clock, RefreshCw, WifiOff } from 'lucide-react';
import './ErrorState.css';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  statusCode?: number | null;
  onRetry?: () => void;
  retryLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message = "Couldn't load routes.",
  statusCode,
  onRetry,
  retryLabel = 'Retry',
  actionLabel,
  onAction,
  className = '',
}) => {
  const isRateLimited = statusCode === 429 || message.toLowerCase().includes('busy');
  const isNetworkIssue = statusCode === 0 || statusCode === 503 || message.toLowerCase().includes('network');

  const defaultTitle = isRateLimited
    ? 'Route Service Busy'
    : isNetworkIssue
    ? 'Network Connection Issue'
    : "Couldn't Load Routes";

  const displayTitle = title || defaultTitle;

  return (
    <div
      className={`sr-error-state-card ${isRateLimited ? 'rate-limited' : ''} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-icon-box">
        {isRateLimited ? (
          <Clock size={28} className="error-icon timer" />
        ) : isNetworkIssue ? (
          <WifiOff size={28} className="error-icon wifi" />
        ) : (
          <AlertTriangle size={28} className="error-icon warning" />
        )}
      </div>

      <div className="error-content-box">
        {statusCode && (
          <span className="error-code-badge">
            {statusCode === 429
              ? 'Status 429 &bull; Rate Limit'
              : statusCode === 503
              ? 'Status 503 &bull; Service Unavailable'
              : statusCode === 404
              ? 'Status 404 &bull; Not Found'
              : 'Network Error'}
          </span>
        )}

        <h3 className="error-title">{displayTitle}</h3>
        <p className="error-description">{message}</p>

        <div className="error-actions-group">
          {onRetry && (
            <button
              type="button"
              className="error-retry-btn"
              onClick={onRetry}
              aria-label={`${retryLabel} route search`}
            >
              <RefreshCw size={15} />
              <span>{retryLabel}</span>
            </button>
          )}

          {actionLabel && onAction && (
            <button
              type="button"
              className="error-secondary-btn"
              onClick={onAction}
            >
              <span>{actionLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
