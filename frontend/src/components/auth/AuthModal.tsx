import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { OtpForm } from './OtpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { X, Shield } from 'lucide-react';
import './AuthModal.css';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalView, setAuthModalView } = useAuth();

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const showTabs = authModalView === 'login' || authModalView === 'register';

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="auth-modal-close-btn"
          onClick={closeAuthModal}
          aria-label="Close authentication modal"
        >
          <X size={20} />
        </button>

        <div className="auth-brand-badge">
          <Shield size={20} />
          <span>SafeRoute Auth</span>
        </div>

        {showTabs && (
          <div className="auth-tabs">
            <button
              className={`auth-tab-btn ${authModalView === 'login' ? 'active' : ''}`}
              onClick={() => setAuthModalView('login')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab-btn ${authModalView === 'register' ? 'active' : ''}`}
              onClick={() => setAuthModalView('register')}
            >
              Create Account
            </button>
          </div>
        )}

        <div className="auth-modal-body">
          {authModalView === 'login' && <LoginForm />}
          {authModalView === 'register' && <RegisterForm />}
          {authModalView === 'otp' && <OtpForm />}
          {authModalView === 'forgot' && <ForgotPasswordForm />}
          {authModalView === 'reset' && <ResetPasswordForm />}
        </div>
      </div>
    </div>
  );
};
