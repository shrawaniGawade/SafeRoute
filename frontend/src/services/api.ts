import { authService } from './authService';

const RAW_API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api';
const API_BASE_URL = RAW_API_URL.endsWith('/') ? RAW_API_URL.slice(0, -1) : RAW_API_URL;

export interface SafetyInput {
  lighting: number;
  crime_risk: number;
  accident_risk: number;
  crowd_level: number;
  emergency_proximity?: number;
  timeOfDay?: string;
  origin?: string;
  source?: string;
  destination?: string;
  departureTime?: string;
  travelMode?: 'walking' | 'driving' | 'transit';
  clientRequestId?: string;
}

export interface RouteAlternativeItem {
  id: string;
  name: string;
  safety_score: number;
  rating: string;
  isRecommended: boolean;
  isNavigable: boolean;
  distanceText: string;
  durationText: string;
  summary: string;
  factors: {
    lighting: number;
    crime_risk: number;
    accident_risk: number;
    crowd_level: number;
    emergency_proximity?: number;
  };
}

export interface SafetyResult {
  safety_score: number;
  model: string;
  data_type: string;
  warning?: string;
  rating?: string;
  predictionId?: string;
  latency_ms?: number;
  origin?: string;
  destination?: string;
  departureTime?: string;
  travelMode?: string;
  scoring_explanation?: string;
  is_navigable?: boolean;
  navigability_notice?: string;
  routing_provider?: string;
  alternatives?: RouteAlternativeItem[];
  createdAt?: string;
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  emergencyContact?: string;
  defaultPreset?: 'night' | 'commute' | 'maximum' | 'custom';
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileUpdateInput {
  name?: string;
  emergencyContact?: string;
  defaultPreset?: 'night' | 'commute' | 'maximum' | 'custom';
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
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

/**
 * 1. AI Safety Prediction: Evaluates route safety score
 */
export async function predictRouteSafety(
  input: SafetyInput
): Promise<SafetyResult> {
  const response = await fetchWithAuth(`${API_BASE_URL}/safety/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  const resJson = await response.json();
  // Support both { success: true, data: { ... } } and direct object
  return (resJson.data ? resJson.data : resJson) as SafetyResult;
}

/**
 * 2. Fetch User Safety Prediction History (Paginated)
 */
export async function fetchSafetyHistory(page = 1, limit = 10): Promise<PaginatedResponse<SafetyResult>> {
  const response = await fetchWithAuth(`${API_BASE_URL}/safety/history?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.status}`);
  }
  return response.json();
}

/**
 * 3. Fetch Single Prediction Details by ID
 */
export async function fetchSafetyPredictionDetails(id: string): Promise<SafetyResult> {
  const response = await fetchWithAuth(`${API_BASE_URL}/safety/history/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch prediction details: ${response.status}`);
  }
  const resJson = await response.json();
  return (resJson.data ? resJson.data : resJson) as SafetyResult;
}

/**
 * 4. User Profile Management
 */
export async function fetchUserProfile(): Promise<UserProfileData> {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/me`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }
  const resJson = await response.json();
  return resJson.data;
}

export async function updateUserProfile(data: UserProfileUpdateInput): Promise<UserProfileData> {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update user profile');
  }
  const resJson = await response.json();
  return resJson.data;
}

/**
 * 5. Admin Console Telemetry & Operations
 */
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
    totalPredictions?: number;
    totalRoutes?: number;
    totalAuditLogs?: number;
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

export async function fetchAdminUsers(
  page = 1,
  limit = 20,
  search = ''
): Promise<PaginatedResponse<UserProfileData>> {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const response = await fetchWithAuth(`${API_BASE_URL}/admin/users?page=${page}&limit=${limit}${searchParam}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch admin users: ${response.status}`);
  }
  return response.json();
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