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
  confirmPassword?: string;
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
  confirmNewPassword?: string;
}

export interface AuthResponse {
  success?: boolean;
  message: string;
  user?: UserProfile;
  accessToken?: string;
  unverified?: boolean;
  email?: string;
  verified?: boolean;
  verificationToken?: string;
}

/**
 * Normalizes API target URLs across Vercel deployments, relative proxies, and custom domains.
 * Prevents missing or duplicate /api prefixes.
 */
export function getApiUrl(endpoint: string): string {
  const envBase = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    '/api'
  ).trim();

  const cleanBase = envBase.endsWith('/') ? envBase.slice(0, -1) : envBase;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If base ends with /api and endpoint starts with /api/, avoid duplicate /api/api
  if (cleanBase.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    return `${cleanBase}${cleanEndpoint.slice(4)}`;
  }

  // If base doesn't include /api and endpoint doesn't start with /api, ensure /api is included
  if (
    !cleanBase.endsWith('/api') &&
    !cleanEndpoint.startsWith('/api') &&
    !cleanBase.includes('/api/')
  ) {
    return `${cleanBase}/api${cleanEndpoint}`;
  }

  return `${cleanBase}${cleanEndpoint}`;
}

/**
 * Performs robust fetch with clear network failure diagnostic messages.
 */
async function safeFetch(url: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err: any) {
    if (err?.name === 'TypeError' || err?.message?.toLowerCase().includes('fetch')) {
      throw new Error(
        `Unable to reach the SafeRoute server. Please verify your internet connection and backend status at: ${url}`
      );
    }
    throw err;
  }
}

/**
 * Handles JSON and non-JSON server responses, providing clear diagnostic errors instead
 * of generic "Server communication error".
 */
async function handleResponse<T>(res: Response, requestedUrl: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    // Non-JSON response received (e.g. HTML from SPA fallback, 404, or gateway timeout)
    const text = await res.text().catch(() => '');
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      if (res.status === 404) {
        throw new Error(
          `API endpoint not found (404) at ${requestedUrl}. Ensure backend is running and VITE_API_BASE_URL is configured.`
        );
      }
      if (res.status >= 500) {
        throw new Error(
          `Server error (HTTP ${res.status}). The backend encountered an unhandled exception or gateway timeout.`
        );
      }
      throw new Error(
        `API configuration error: Server returned HTML page instead of JSON from ${requestedUrl}. If deployed on Vercel, ensure VITE_API_BASE_URL is set to your backend API URL in Vercel Project Settings.`
      );
    }
    data = { message: text.slice(0, 300) || `Request failed with HTTP ${res.status}` };
  }

  if (!res.ok) {
    const errorMsg =
      data?.errors && typeof data.errors === 'object'
        ? Object.values(data.errors).join(', ')
        : data?.message || `Request failed with status ${res.status}`;
    const error: any = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  if (data === null || data === undefined) {
    throw new Error('Received empty response from server.');
  }

  return data as T;
}

export const authService = {
  async sendOtp(
    email: string,
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' = 'EMAIL_VERIFICATION'
  ): Promise<AuthResponse> {
    const url = getApiUrl('/auth/send-otp');
    const res = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, purpose }),
    });
    return handleResponse<AuthResponse>(res, url);
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const url = getApiUrl('/auth/register');
    const res = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res, url);
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const url = getApiUrl('/auth/login');
    const res = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res, url);
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponse> {
    const url = getApiUrl('/auth/verify-otp');
    const res = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res, url);
  },

  async resendOtp(payload: ResendOtpPayload): Promise<AuthResponse> {
    const url = getApiUrl('/auth/resend-otp');
    const res = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res, url);
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    const url = getApiUrl('/auth/refresh-token');
    const res = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse<{ accessToken: string }>(res, url);
  },

  async forgotPassword(email: string): Promise<AuthResponse> {
    const url = getApiUrl('/auth/forgot-password');
    const res = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    return handleResponse<AuthResponse>(res, url);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<AuthResponse> {
    const url = getApiUrl('/auth/reset-password');
    const res = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res, url);
  },

  async logout(): Promise<AuthResponse> {
    const url = getApiUrl('/auth/logout');
    const res = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return handleResponse<AuthResponse>(res, url);
  },

  async getMe(accessToken: string): Promise<{ user: UserProfile }> {
    const url = getApiUrl('/auth/me');
    const res = await safeFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });
    return handleResponse<{ user: UserProfile }>(res, url);
  },
};
