const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
}

export interface ResendOtpPayload {
  email: string;
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface AuthResponse {
  message: string;
  user?: UserProfile;
  accessToken?: string;
  unverified?: boolean;
  email?: string;
  verified?: boolean;
  devOtp?: string;
  emailPreviewUrl?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({ message: 'Server communication error' }));
  if (!res.ok) {
    const errorMsg =
      data.errors && typeof data.errors === 'object'
        ? Object.values(data.errors).join(', ')
        : data.message || `Request failed with status ${res.status}`;
    const error: any = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data as T;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  async resendOtp(payload: ResendOtpPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse<{ accessToken: string }>(res);
  },

  async forgotPassword(email: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    return handleResponse<AuthResponse>(res);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  async logout(): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse<AuthResponse>(res);
  },

  async getMe(accessToken: string): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });
    return handleResponse<{ user: UserProfile }>(res);
  },
};
