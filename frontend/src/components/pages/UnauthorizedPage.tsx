import React from 'react';
import { ShieldAlert, LogOut, Home, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UnauthorizedPageProps {
  onNavigate: (route: string) => void;
  onLogout?: () => void;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ onNavigate, onLogout }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      onNavigate('login');
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'white',
          borderRadius: '20px',
          border: '1px solid #fecaca',
          boxShadow: '0 20px 40px -15px rgba(239, 68, 68, 0.12)',
          padding: '48px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.15))',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 0 0 8px rgba(239, 68, 68, 0.05)',
          }}
        >
          <ShieldAlert size={42} />
        </div>

        <span
          style={{
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#dc2626',
            background: '#fee2e2',
            padding: '4px 12px',
            borderRadius: '999px',
            marginBottom: '14px',
          }}
        >
          Error 403 &bull; Access Denied
        </span>

        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 12px',
            lineHeight: 1.25,
          }}
        >
          Administrative Clearance Required
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: '#64748b',
            lineHeight: 1.6,
            margin: '0 0 24px',
          }}
        >
          You do not have administrative clearance to access the SafeRoute Command Center.
          Current role: <strong style={{ color: '#0f172a' }}>{user?.role || 'Guest'}</strong> ({user?.email || 'Unauthenticated'}).
        </p>

        <div
          style={{
            padding: '12px 16px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            width: '100%',
            marginBottom: '28px',
            textAlign: 'left',
            fontSize: '13px',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <KeyRound size={18} color="#dc2626" style={{ flexShrink: 0 }} />
          <span>If you need administrative access, please sign in with an authorized admin account.</span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <button
            type="button"
            onClick={() => onNavigate('app')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #087f8c, #0284c7)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(8, 127, 140, 0.3)',
            }}
          >
            <Home size={16} />
            <span>Return to Dashboard</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
