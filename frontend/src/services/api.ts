import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface SafetyInput {
  lighting: number;
  crime_risk: number;
  accident_risk: number;
  crowd_level: number;
}

export interface SafetyResult {
  safety_score: number;
  model: string;
  data_type: string;
  warning: string;
}

// In-memory token reference for authenticated requests
let activeAccessToken: string | null = null;

export function setActiveAccessToken(token: string | null) {
  activeAccessToken = token;
}

export function getActiveAccessToken(): string | null {
  return activeAccessToken;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  if (activeAccessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${activeAccessToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If unauthorized and we had a token, try silent refresh once
  if (response.status === 401 && activeAccessToken) {
    try {
      const refreshed = await authService.refreshToken();
      if (refreshed?.accessToken) {
        setActiveAccessToken(refreshed.accessToken);
        headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
        return fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
      }
    } catch {
      setActiveAccessToken(null);
    }
  }

  return response;
}

export async function predictRouteSafety(
  input: SafetyInput
): Promise<SafetyResult> {
  const response = await fetch(`${API_BASE_URL}/safety/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<SafetyResult>;
}

export interface AdminStatsResponse {
  server: {
    uptimeSeconds: number;
    nodeVersion: string;
    environment: string;
    memoryUsageMb: number;
  };
  services: {
    backend: { status: string; port: number; latencyMs: number };
    aiScoringEngine: { status: string; endpoint: string; latencyMs: number };
    database: { status: string; engine: string };
    emailGateway: { status: string; provider: string };
  };
  stats: {
    totalUsers: number;
    verifiedUsers: number;
    adminUsers: number;
    verificationRate: number;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    isVerified: boolean;
    createdAt?: string;
    lastLogin?: string;
  }>;
}

export async function fetchAdminStats(): Promise<AdminStatsResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/admin/stats`);
  if (!response.ok) {
    throw new Error(`Admin stats request failed: ${response.status}`);
  }
  const data = await response.json();
  return data.data;
}

export async function updateAdminUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update user role');
  }
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete user');
  }
}