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
  devOtp: string | null;
  emailPreviewUrl: string | null;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  openAuthModal: (view?: AuthModalView) => void;
  closeAuthModal: () => void;
  setAuthModalView: (view: AuthModalView) => void;
  setPendingOtpInfo: (email: string, purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET') => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
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
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);
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

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    try {
      const response = await authService.login(payload);
      if (response.user && response.accessToken) {
        updateSession(response.accessToken, response.user);
        closeAuthModal();
        showToast(`Welcome back, ${response.user.name}!`, 'success');
      }
      return response;
    } catch (error: any) {
      if (error?.data?.unverified) {
        setPendingOtpInfo(payload.email, 'EMAIL_VERIFICATION');
        if (error.data.devOtp) setDevOtp(error.data.devOtp);
        if (error.data.emailPreviewUrl) setEmailPreviewUrl(error.data.emailPreviewUrl);
        setAuthModalView('otp');
      }
      throw error;
    }
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await authService.register(payload);
    setPendingOtpInfo(payload.email, 'EMAIL_VERIFICATION');
    if (response.devOtp) setDevOtp(response.devOtp);
    if (response.emailPreviewUrl) setEmailPreviewUrl(response.emailPreviewUrl);
    setAuthModalView('otp');
    showToast('Verification code generated!', 'info');
    return response;
  };

  const verifyOtp = async (payload: VerifyOtpPayload): Promise<AuthResponse> => {
    const response = await authService.verifyOtp(payload);
    if (payload.purpose === 'EMAIL_VERIFICATION' && response.user && response.accessToken) {
      updateSession(response.accessToken, response.user);
      closeAuthModal();
      showToast('Account verified! Welcome to SafeRoute.', 'success');
    } else if (payload.purpose === 'PASSWORD_RESET') {
      setPendingResetOtp(payload.otp);
      setAuthModalView('reset');
      showToast('Code verified. Set your new password.', 'success');
    }
    return response;
  };

  const resendOtp = async (payload: ResendOtpPayload): Promise<AuthResponse> => {
    const response = await authService.resendOtp(payload);
    if (response.devOtp) setDevOtp(response.devOtp);
    if (response.emailPreviewUrl) setEmailPreviewUrl(response.emailPreviewUrl);
    showToast(response.message, 'info');
    return response;
  };

  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    const response = await authService.forgotPassword(email);
    setPendingOtpInfo(email, 'PASSWORD_RESET');
    setPendingResetOtp('');
    if (response.devOtp) setDevOtp(response.devOtp);
    if (response.emailPreviewUrl) setEmailPreviewUrl(response.emailPreviewUrl);
    setAuthModalView('otp');
    showToast('Verification code dispatched!', 'info');
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
        devOtp,
        emailPreviewUrl,
        toastMessage,
        openAuthModal,
        closeAuthModal,
        setAuthModalView,
        setPendingOtpInfo,
        showToast,
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
