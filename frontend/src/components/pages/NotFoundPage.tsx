import React from 'react';
import { Compass, ArrowRight, Shield, Home } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (route: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
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
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
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
            background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.12), rgba(15, 118, 110, 0.18))',
            color: '#0d9488',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 0 0 8px rgba(13, 148, 136, 0.06)',
          }}
        >
          <Compass size={40} />
        </div>

        <span
          style={{
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#0d9488',
            background: '#ccfbf1',
            padding: '4px 12px',
            borderRadius: '999px',
            marginBottom: '14px',
          }}
        >
          Error 404 &bull; Off-Route
        </span>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 12px',
            lineHeight: 1.25,
          }}
        >
          Route Segment Not Found
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: '#64748b',
            lineHeight: 1.6,
            margin: '0 0 32px',
          }}
        >
          The path, coordinate waypoint, or page you were looking for is not mapped in
          our active safety network. Return to the dashboard or explore our safe corridors.
        </p>

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
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Home size={16} />
            <span>Go to Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('landing')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <span>Public Home</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div
          style={{
            marginTop: '36px',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#94a3b8',
          }}
        >
          <Shield size={14} color="#0d9488" />
          <span>SafeRoute AI Intelligent Corridors</span>
        </div>
      </div>
    </div>
  );
};
