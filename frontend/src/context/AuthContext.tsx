import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  authService,
  type UserProfile,
  type RegisterPayload,
  type LoginPayload,
  type VerifyOtpPayload,
  type ResendOtpPayload,
  type ResetPasswordPayload,
  type AuthResponse,
} from '../services/authService';
import { setActiveAccessToken } from '../services/api';

export type AuthModalView = 'login' | 'register' | 'otp' | 'forgot' | 'reset';

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalView: AuthModalView;
  pendingOtpEmail: string;
  pendingOtpPurpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  pendingResetOtp: string;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  openAuthModal: (view?: AuthModalView) => void;
  closeAuthModal: () => void;
  setAuthModalView: (view: AuthModalView) => void;
  setPendingOtpInfo: (email: string, purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET') => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  sendOtp: (email: string, purpose?: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET') => Promise<AuthResponse>;
  login: (payload: LoginPayload, requiredRole?: UserProfile['role']) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<AuthResponse>;
  resendOtp: (payload: ResendOtpPayload) => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string>('');
  const [pendingOtpPurpose, setPendingOtpPurpose] = useState<
    'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
  >('EMAIL_VERIFICATION');
  const [pendingResetOtp, setPendingResetOtp] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToastMessage({ text, type });
      setTimeout(() => {
        setToastMessage((current) => (current?.text === text ? null : current));
      }, 5000);
    },
    []
  );

  const updateSession = useCallback(
    (token: string | null, userData: UserProfile | null) => {
      setAccessToken(token);
      setActiveAccessToken(token);
      setUser(userData);
    },
    []
  );

  // Silent restore on app initialization using HTTP-only cookie
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const { accessToken: newToken } = await authService.refreshToken();
        if (newToken && isMounted) {
          const { user: profile } = await authService.getMe(newToken);
          if (isMounted) {
            updateSession(newToken, profile);
          }
        }
      } catch {
        if (isMounted) {
          updateSession(null, null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [updateSession]);

  const openAuthModal = useCallback((view: AuthModalView = 'login') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const setPendingOtpInfo = useCallback(
    (email: string, purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET') => {
      setPendingOtpEmail(email);
      setPendingOtpPurpose(purpose);
    },
    []
  );

  const login = async (payload: LoginPayload, requiredRole?: UserProfile['role']): Promise<AuthResponse> => {
    try {
      const response = await authService.login(payload);
      if (requiredRole && response.user?.role !== requiredRole) {
        await authService.logout().catch(() => undefined);
        throw new Error('This sign-in page is for administrators only.');
      }
      if (response.user && response.accessToken) {
        updateSession(response.accessToken, response.user);
        closeAuthModal();
        if (response.user.role === 'admin') {
          window.location.hash = '#/admin';
        } else {
          window.location.hash = '#/app';
        }
        showToast(`Welcome back, ${response.user.name}!`, 'success');
      }
      return response;
    } catch (error: any) {
      if (error?.data?.unverified) {
        setPendingOtpInfo(payload.email, 'EMAIL_VERIFICATION');
        setAuthModalView('otp');
      }
      throw error;
    }
  };

  const sendOtp = async (
    email: string,
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' = 'EMAIL_VERIFICATION'
  ): Promise<AuthResponse> => {
    const response = await authService.sendOtp(email, purpose);
    setPendingOtpInfo(email, purpose);
    showToast(response.message || 'Verification code sent. Please check your inbox and spam folder.', 'info');
    return response;
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await authService.register(payload);
    if (response.user && response.accessToken) {
      updateSession(response.accessToken, response.user);
      closeAuthModal();
      if (response.user.role === 'admin') {
        window.location.hash = '#/admin';
      } else {
        window.location.hash = '#/app';
      }
      showToast('Account created successfully! Welcome to SafeRoute.', 'success');
    } else {
      setPendingOtpInfo(payload.email, 'EMAIL_VERIFICATION');
      setAuthModalView('otp');
      showToast(response.message || 'Registration initiated! Please enter the 6-digit verification code.', 'info');
    }
    return response;
  };

  const verifyOtp = async (payload: VerifyOtpPayload): Promise<AuthResponse> => {
    const response = await authService.verifyOtp(payload);
    if (payload.purpose === 'EMAIL_VERIFICATION') {
      if (response.user && response.accessToken) {
        updateSession(response.accessToken, response.user);
        closeAuthModal();
        showToast('Account verified! Welcome to SafeRoute.', 'success');
      } else {
        showToast(response.message || 'Email verified successfully!', 'success');
      }
    } else if (payload.purpose === 'PASSWORD_RESET') {
      setPendingResetOtp(payload.otp);
      setAuthModalView('reset');
      showToast('Code verified. Set your new password.', 'success');
    }
    return response;
  };

  const resendOtp = async (payload: ResendOtpPayload): Promise<AuthResponse> => {
    const response = await authService.resendOtp(payload);
    showToast(response.message || 'Verification code resent.', 'info');
    return response;
  };

  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    const response = await authService.forgotPassword(email);
    setPendingOtpInfo(email, 'PASSWORD_RESET');
    setPendingResetOtp('');
    setAuthModalView('otp');
    showToast('Verification code dispatched! Please check your inbox.', 'info');
    return response;
  };

  const resetPassword = async (payload: ResetPasswordPayload): Promise<AuthResponse> => {
    const response = await authService.resetPassword(payload);
    setPendingResetOtp('');
    setAuthModalView('login');
    showToast('Password reset successfully! Please sign in with your new password.', 'success');
    return response;
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
      // Clear local state
    } finally {
      updateSession(null, null);
      showToast('You have been logged out.', 'info');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authModalView,
        pendingOtpEmail,
        pendingOtpPurpose,
        pendingResetOtp,
        toastMessage,
        openAuthModal,
        closeAuthModal,
        setAuthModalView,
        setPendingOtpInfo,
        showToast,
        sendOtp,
        login,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
