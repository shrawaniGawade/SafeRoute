import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, size = 'md', showLabel = true }) => {
  let category = 'High Risk';
  let color = '#ef4444';
  let bgColor = '#fef2f2';
  let borderColor = '#fecaca';
  let Icon = ShieldAlert;

  if (score >= 80) {
    category = 'Safe Corridor';
    color = '#10b981';
    bgColor = '#ecfdf5';
    borderColor = '#a7f3d0';
    Icon = ShieldCheck;
  } else if (score >= 50) {
    category = 'Moderate Caution';
    color = '#f59e0b';
    bgColor = '#fffbeb';
    borderColor = '#fde68a';
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
