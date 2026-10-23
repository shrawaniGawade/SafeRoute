import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Analyzing safety telemetry...',
  size = 28,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '36px 20px',
        color: 'var(--ti-muted, #a1a1aa)',
      }}
    >
      <Loader2
        size={size}
        style={{
          color: 'var(--ti-ink-soft, #d4d4d8)',
          animation: 'spin 0.9s linear infinite',
        }}
      />
      <span style={{ fontSize: '14px', fontWeight: 500 }}>{message}</span>
    </div>
  );
};
