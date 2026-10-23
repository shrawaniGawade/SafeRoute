import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, size = 'md', showLabel = true }) => {
  let category = 'High Risk';
  let color = 'var(--ti-danger, #f87171)';
  let bgColor = 'var(--ti-danger-bg, rgba(248, 113, 113, 0.1))';
  let borderColor = 'var(--ti-danger-line, rgba(248, 113, 113, 0.24))';
  let Icon = ShieldAlert;

  if (score >= 80) {
    category = 'Safe Corridor';
    color = 'var(--ti-success, #34d399)';
    bgColor = 'var(--ti-success-bg, rgba(52, 211, 153, 0.1))';
    borderColor = 'var(--ti-success-line, rgba(52, 211, 153, 0.24))';
    Icon = ShieldCheck;
  } else if (score >= 50) {
    category = 'Moderate Caution';
    color = 'var(--ti-warn, #fbbf24)';
    bgColor = 'var(--ti-warn-bg, rgba(251, 191, 36, 0.1))';
    borderColor = 'var(--ti-warn-line, rgba(251, 191, 36, 0.24))';
    Icon = AlertTriangle;
  }

  const paddingMap = {
    sm: '4px 8px',
    md: '6px 12px',
    lg: '10px 18px',
  };

  const fontSizeMap = {
    sm: '12px',
    md: '14px',
    lg: '18px',
  };

  const iconSizeMap = {
    sm: 14,
    md: 16,
    lg: 22,
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: paddingMap[size],
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '20px',
        color,
        fontSize: fontSizeMap[size],
        fontWeight: 700,
        letterSpacing: '-0.01em',
      }}
    >
      <Icon size={iconSizeMap[size]} />
      <span>{score}/100</span>
      {showLabel && <span style={{ opacity: 0.85, fontWeight: 500 }}>&bull; {category}</span>}
    </div>
  );
};
