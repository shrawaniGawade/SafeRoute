import React, { type ReactNode } from 'react';
import { Compass } from 'lucide-react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  role?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  hint,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  role = 'status',
}) => {
  return (
    <div
      className={`sr-empty-state-panel ${className}`}
      role={role}
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--ti-surface-2, #141416)',
        border: '1px dashed var(--ti-line-strong, rgba(255, 255, 255, 0.18))',
        borderRadius: '16px',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid var(--ti-line, rgba(255, 255, 255, 0.09))',
          color: 'var(--ti-ink-soft, #d4d4d8)',
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
          color: 'var(--ti-ink, #f4f4f5)',
          margin: '0 0 6px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: 'var(--ti-muted, #a1a1aa)',
          maxWidth: '440px',
          lineHeight: 1.5,
          margin: hint ? '0 0 8px' : '0 0 20px',
        }}
      >
        {description}
      </p>

      {hint && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--ti-ink-soft, #d4d4d8)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--ti-line, rgba(255, 255, 255, 0.09))',
            borderRadius: '8px',
            padding: '6px 14px',
            marginBottom: '20px',
            fontWeight: 500,
          }}
        >
          {hint}
        </div>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'var(--ti-metal, linear-gradient(180deg, #fafafa 0%, #d4d4d8 100%))',
                color: 'var(--ti-accent-ink, #09090b)',
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

          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '9px 18px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--ti-ink-soft, #d4d4d8)',
                border: '1px solid var(--ti-line, rgba(255, 255, 255, 0.09))',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
