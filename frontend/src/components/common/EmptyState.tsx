import React, { type ReactNode } from 'react';
import { Compass } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        background: '#ffffff',
        border: '1px dashed #cbd5e1',
        borderRadius: '16px',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#f0fdfa',
          color: '#087f8c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        {icon || <Compass size={28} />}
      </div>
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 6px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: '#64748b',
          maxWidth: '440px',
          lineHeight: 1.5,
          margin: '0 0 20px',
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#087f8c',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
