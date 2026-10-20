import { authService, getApiUrl } from './authService';

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
  maxDetour?: number | { maxDetourPct?: number; maxDetourMin?: number };
  maxDetourMinutes?: number;
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
}

export interface RouteAlternativeItem {
  id: string;
  letter?: 'A' | 'B' | 'C' | string;
  name: string;
  safety_score: number;
  rating: string;
  isRecommended: boolean;
  recommendationReason?: string;
  isRealRoutingData?: boolean;
  isNavigable: boolean;
  distanceKm?: number | null;
  distanceText: string;
  durationMinutes?: number | null;
  durationText: string;
  summary: string;
  color?: string;
  type?: 'safe_corridor' | 'balanced_transit' | 'direct_shortcut' | string;
  safetyAttributes?: string[];
  caveats?: string[];
  waypoints?: Array<{ lat: number; lng: number }>;
  geometry?: [number, number][]; // GeoJSON [lng, lat][]
  coordinates?: [number, number][];
  instructions?: string[];
  factors: {
    lighting: number;
    crime_risk: number;
    accident_risk: number;
    crowd_level: number;
    emergency_proximity?: number;
  };
}

export interface FactorReasonItem {
  factor: string;
  score: number;
  reason: string;
}

export interface RecommendationExplanation {
  summary: string;
  factorReasons?: FactorReasonItem[];
  disclaimer?: string;
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
  originCoords?: { lat: number; lng: number; label: string };
  destinationCoords?: { lat: number; lng: number; label: string };
  departureTime?: string;
  travelMode?: string;
  scoring_explanation?: string;
  is_navigable?: boolean;
  isRealRoutingData?: boolean;
  navigability_notice?: string;
  routing_provider?: string;
  recommendedIndex?: number;
  recommendedRouteId?: string | null;
  explanation?: RecommendationExplanation;
  statusMessage?: string;
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

export class RouteApiError extends Error {
  statusCode: number;
  code?: string;
  userMessage: string;

  constructor(statusCode: number, userMessage: string, code?: string) {
    super(userMessage);
    this.name = 'RouteApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.userMessage = userMessage;
    Object.setPrototypeOf(this, RouteApiError.prototype);
  }
}

export function formatRouteErrorMessage(status: number, rawMessage?: string): string {
  if (status === 429) {
    return 'Route service is busy. Please retry in a minute.';
  }
  if (status === 404) {
    return 'No route available between these points.';
  }
  if (status === 503 || status === 500 || status === 502 || status === 504 || status === 0) {
    return "Couldn't load routes.";
  }
  if (
    rawMessage &&
    !rawMessage.toLowerCase().includes('internal server error') &&
    !rawMessage.toLowerCase().includes('service unavailable') &&
    !rawMessage.toLowerCase().includes('econnrefused') &&
    !rawMessage.toLowerCase().includes('failed to fetch') &&
    !rawMessage.toLowerCase().includes('<!doctype')
  ) {
    return rawMessage;
  }
  return "Couldn't load routes.";
}

/**
 * 1. AI Safety Prediction: Evaluates route safety score
 */
export async function predictRouteSafety(
  input: SafetyInput
): Promise<SafetyResult> {
  try {
    const response = await fetchWithAuth(getApiUrl('/safety/predict'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const userMessage = formatRouteErrorMessage(response.status, errorData.message);
      throw new RouteApiError(response.status, userMessage, errorData.code);
    }

    const resJson = await response.json();
    // Support both { success: true, data: { ... } } and direct object
    return (resJson.data ? resJson.data : resJson) as SafetyResult;
  } catch (err: any) {
    if (err instanceof RouteApiError) {
      throw err;
    }
    // Frontend .catch(): Raw network / connection errors are NEVER shown
    throw new RouteApiError(0, "Couldn't load routes.", 'NETWORK_ERROR');
  }
}

/**
 * 2. Fetch User Safety Prediction History (Paginated)
 */
export async function fetchSafetyHistory(page = 1, limit = 10): Promise<PaginatedResponse<SafetyResult>> {
  const response = await fetchWithAuth(getApiUrl(`/safety/history?page=${page}&limit=${limit}`));
  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.status}`);
  }
  return response.json();
}

/**
 * 3. Fetch Single Prediction Details by ID
 */
export async function fetchSafetyPredictionDetails(id: string): Promise<SafetyResult> {
  const response = await fetchWithAuth(getApiUrl(`/safety/history/${id}`));
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
  const response = await fetchWithAuth(getApiUrl('/users/me'));
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }
  const resJson = await response.json();
  return resJson.data;
}

export async function updateUserProfile(data: UserProfileUpdateInput): Promise<UserProfileData> {
  const response = await fetchWithAuth(getApiUrl('/users/me'), {
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
  const response = await fetchWithAuth(getApiUrl('/admin/stats'));
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
  const response = await fetchWithAuth(getApiUrl(`/admin/users?page=${page}&limit=${limit}${searchParam}`));
  if (!response.ok) {
    throw new Error(`Failed to fetch admin users: ${response.status}`);
  }
  return response.json();
}

export async function updateAdminUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
  const response = await fetchWithAuth(getApiUrl(`/admin/users/${userId}/role`), {
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
  const response = await fetchWithAuth(getApiUrl(`/admin/users/${userId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete user');
  }
}

export interface GeocodeResult {
  placeId: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  importance?: number;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

/**
 * Searches places / addresses using backend geocoding proxy
 */
export async function geocodeLocations(query: string, limit = 5): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 3 && !/^[-+]?\d/.test(q)) return [];

  // Try /api/safety/geocode first, fallback to /api/geocode
  let url = getApiUrl(`/safety/geocode?q=${encodeURIComponent(q)}&limit=${limit}`);
  let response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok && response.status === 404) {
    url = getApiUrl(`/geocode?q=${encodeURIComponent(q)}&limit=${limit}`);
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  }

  if (!response.ok) {
    if (response.status === 400 || response.status === 422) return [];
    throw new Error(`Location search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}