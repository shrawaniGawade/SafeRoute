import bcrypt from 'bcryptjs';
import crypto from 'crypto';

function generateHexId(): string {
  return crypto.randomBytes(12).toString('hex');
}

export interface InMemoryUserDoc {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  emergencyContact?: string;
  defaultPreset?: 'night' | 'commute' | 'maximum' | 'custom';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  save(): Promise<InMemoryUserDoc>;
  toJSON(): Record<string, any>;
  toObject(): Record<string, any>;
}

export interface InMemoryOtpDoc {
  _id: string;
  email: string;
  hashedOtp: string;
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  attempts: number;
  verified?: boolean;
  verificationTokenHash?: string;
  verifiedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<InMemoryOtpDoc>;
}

export interface InMemoryRefreshTokenDoc {
  _id: string;
  userId: any;
  tokenHash: string;
  family: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<InMemoryRefreshTokenDoc>;
}

export interface InMemorySafetyPredictionDoc {
  _id: string;
  user?: any;
  clientRequestId?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  travelMode?: 'walking' | 'driving' | 'transit';
  factors: {
    lighting: number;
    crime_risk: number;
    accident_risk: number;
    crowd_level: number;
  };
  safety_score: number;
  prediction_details: {
    classification: string;
    recommendation: string;
    factor_breakdown?: any;
  };
  model_info: {
    model_name: string;
    version: string;
    data_source: string;
    is_fallback?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<InMemorySafetyPredictionDoc>;
}

export interface InMemoryRouteHistoryDoc {
  _id: string;
  user?: any;
  predictionId?: any;
  clientRequestId?: string;
  origin: {
    name: string;
    coordinates?: { lat: number; lng: number };
  };
  destination: {
    name: string;
    coordinates?: { lat: number; lng: number };
  };
  selectedRoute: {
    routeName: string;
    travelMode: 'walking' | 'driving' | 'transit';
    distanceText?: string;
    durationText?: string;
    safetyScore: number;
    waypoints?: Array<{ lat: number; lng: number; label?: string }>;
    polyline?: string;
    summary?: string;
  };
  status: 'requested' | 'selected' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<InMemoryRouteHistoryDoc>;
}

export interface InMemoryAuditLogDoc {
  _id: string;
  action: string;
  actor: {
    userId?: any;
    email?: string;
    role?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  target: {
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
  };
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  metadata?: Record<string, any>;
  errorMessage?: string;
  createdAt: Date;
}

export interface InMemorySafetyRecordDoc {
  _id: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  factor: string;
  value: number;
  source: string;
  isSample: boolean;
  externalId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<InMemorySafetyRecordDoc>;
  toJSON(): Record<string, any>;
  toObject(): Record<string, any>;
}

export interface InMemoryEmergencyLocationDoc {
  _id: string;
  name: string;
  type: 'hospital' | 'police' | 'fire_station' | 'emergency_care' | 'other';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  phone?: string;
  source: string;
  osmId?: string;
  address?: string;
  isSample?: boolean;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<InMemoryEmergencyLocationDoc>;
  toJSON(): Record<string, any>;
  toObject(): Record<string, any>;
}

export interface InMemoryCustomPlaceDoc {
  _id: string;
  name: string;
  aliases: string[];
  category: string;
  pinType: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  lat: number;
  lng: number;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  postcode?: string;
  landmark?: string;
  description?: string;
  creatorName?: string;
  creatorId?: any;
  source: string;
  verificationStatus: string;
  reportCount: number;
  reportReasons: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<InMemoryCustomPlaceDoc>;
  toJSON(): Record<string, any>;
  toObject(): Record<string, any>;
}

export interface InMemoryHazardReportDoc {
  _id: string;
  hazardType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  lat: number;
  lng: number;
  landmark?: string;
  reportedBy?: string;
  status: 'active' | 'resolved' | 'expired';
  verificationCount: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<InMemoryHazardReportDoc>;
  toJSON(): Record<string, any>;
  toObject(): Record<string, any>;
}

const usersMap = new Map<string, InMemoryUserDoc>();
const otpsMap = new Map<string, InMemoryOtpDoc>();
const refreshTokensMap = new Map<string, InMemoryRefreshTokenDoc>();
const predictionsMap = new Map<string, InMemorySafetyPredictionDoc>();
const routeHistoriesMap = new Map<string, InMemoryRouteHistoryDoc>();
const auditLogsMap = new Map<string, InMemoryAuditLogDoc>();
const safetyRecordsMap = new Map<string, InMemorySafetyRecordDoc>();
const emergencyLocationsMap = new Map<string, InMemoryEmergencyLocationDoc>();
const customPlacesMap = new Map<string, InMemoryCustomPlaceDoc>();
const hazardReportsMap = new Map<string, InMemoryHazardReportDoc>();

export const memoryUser = {
  findOne(query: { email?: string; _id?: any }) {
    let selectFields = '-password';
    const findPromise = (async () => {
      if (query?._id) {
        const u = usersMap.get(query._id.toString());
        if (!u) return null;
        return formatUser(u, selectFields);
      }
      if (!query?.email) return null;
      const targetEmail = query.email.toLowerCase().trim();
      for (const u of usersMap.values()) {
        if (u.email.toLowerCase().trim() === targetEmail) {
          return formatUser(u, selectFields);
        }
      }
      return null;
    })();

    const queryObj = {
      select: (fields: string) => {
        selectFields = fields;
        return findPromise;
      },
      then: findPromise.then.bind(findPromise),
      catch: findPromise.catch.bind(findPromise),
      finally: findPromise.finally.bind(findPromise),
    };

    return queryObj;
  },

  find(query?: any) {
    let selectFields = '-password';
    const listPromise = (async () => {
      let results = Array.from(usersMap.values());
      if (query?.role) {
        results = results.filter((u) => u.role === query.role);
      }
      if (query?.isVerified !== undefined) {
        results = results.filter((u) => u.isVerified === query.isVerified);
      }
      return results.map((u) => formatUser(u, selectFields));
    })();

    const queryObj = {
      select: (fields: string) => {
        selectFields = fields;
        return queryObj;
      },
      sort: () => queryObj,
      then: listPromise.then.bind(listPromise),
      catch: listPromise.catch.bind(listPromise),
      finally: listPromise.finally.bind(listPromise),
    };

    return queryObj;
  },

  async countDocuments(query?: any): Promise<number> {
    let results = Array.from(usersMap.values());
    if (query?.role) {
      results = results.filter((u) => u.role === query.role);
    }
    if (query?.isVerified !== undefined) {
      results = results.filter((u) => u.isVerified === query.isVerified);
    }
    return results.length;
  },

  async findById(id: string): Promise<InMemoryUserDoc | null> {
    const user = usersMap.get(id.toString());
    return user ? formatUser(user, '-password') : null;
  },

  async findByIdAndUpdate(id: string, update: any): Promise<InMemoryUserDoc | null> {
    const user = usersMap.get(id.toString());
    if (!user) return null;
    if (update.$set) {
      Object.assign(user, update.$set);
    } else {
      Object.assign(user, update);
    }
    user.updatedAt = new Date();
    usersMap.set(id.toString(), user);
    return formatUser(user, '-password');
  },

  async findByIdAndDelete(id: string): Promise<InMemoryUserDoc | null> {
    const user = usersMap.get(id.toString());
    if (!user) return null;
    usersMap.delete(id.toString());
    return user;
  },

  async create(data: {
    name: string;
    email: string;
    password?: string;
    isVerified?: boolean;
    role?: 'user' | 'admin';
  }): Promise<InMemoryUserDoc> {
    const normalizedEmail = data.email.toLowerCase().trim();

    // Enforce unique email constraint like MongoDB
    for (const existing of usersMap.values()) {
      if (existing.email.toLowerCase().trim() === normalizedEmail) {
        const err: any = new Error(
          `E11000 duplicate key error collection: saferoute.users index: email_1 dup key: { email: "${normalizedEmail}" }`
        );
        err.code = 11000;
        err.keyPattern = { email: 1 };
        err.keyValue = { email: normalizedEmail };
        throw err;
      }
    }

    // Role validation
    if (data.role && !['user', 'admin'].includes(data.role)) {
      const err: any = new Error('User validation failed: role: Role must be either "user" or "admin"');
      err.name = 'ValidationError';
      throw err;
    }

    const id = generateHexId();
    let hashedPassword = data.password;
    if (data.password) {
      const salt = await bcrypt.genSalt(12);
      hashedPassword = await bcrypt.hash(data.password, salt);
    }

    const doc: InMemoryUserDoc = {
      _id: id,
      name: data.name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: data.role || 'user',
      isVerified: !!data.isVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
      async comparePassword(candidate: string): Promise<boolean> {
        if (!this.password) return false;
        return bcrypt.compare(candidate, this.password);
      },
      async save(): Promise<InMemoryUserDoc> {
        this.updatedAt = new Date();
        if (this.password && !this.password.startsWith('$2')) {
          const salt = await bcrypt.genSalt(12);
          this.password = await bcrypt.hash(this.password, salt);
        }
        usersMap.set(this._id, this);
        return this;
      },
      toJSON() {
        const copy: any = { ...this };
        delete copy.password;
        return copy;
      },
      toObject() {
        const copy: any = { ...this };
        delete copy.password;
        return copy;
      },
    };

    usersMap.set(id, doc);
    return doc;
  },
};

function formatUser(user: InMemoryUserDoc, selectFields: string): InMemoryUserDoc {
  if (selectFields.includes('+password') || selectFields === 'password') {
    return user;
  }
  // Return copy without password
  const copy: any = Object.create(user);
  Object.assign(copy, user);
  if (!selectFields.includes('+password')) {
    delete copy.password;
  }
  return copy;
}

export const memoryOtp = {
  async findOne(query: { email?: string; purpose?: string; verified?: boolean }): Promise<InMemoryOtpDoc | null> {
    const email = query.email?.toLowerCase().trim();
    for (const o of otpsMap.values()) {
      if ((!email || o.email === email) && (!query.purpose || o.purpose === query.purpose)) {
        if (query.verified !== undefined && !!o.verified !== query.verified) {
          continue;
        }
        if (o.expiresAt > new Date()) {
          return o;
        }
      }
    }
    return null;
  },

  async create(data: {
    email: string;
    hashedOtp: string;
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
    expiresAt: Date;
  }): Promise<InMemoryOtpDoc> {
    const id = generateHexId();
    const doc: InMemoryOtpDoc = {
      _id: id,
      email: data.email.toLowerCase().trim(),
      hashedOtp: data.hashedOtp,
      purpose: data.purpose,
      attempts: 0,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      async save(): Promise<InMemoryOtpDoc> {
        this.updatedAt = new Date();
        otpsMap.set(this._id, this);
        return this;
      },
    };

    otpsMap.set(id, doc);
    return doc;
  },

  async deleteMany(query: { email?: string; purpose?: string }): Promise<void> {
    const email = query.email?.toLowerCase().trim();
    for (const [key, o] of otpsMap.entries()) {
      if ((!email || o.email === email) && (!query.purpose || o.purpose === query.purpose)) {
        otpsMap.delete(key);
      }
    }
  },

  async deleteOne(query: { _id?: any }): Promise<void> {
    if (query?._id) {
      otpsMap.delete(query._id.toString());
    }
  },
};

export const memoryRefreshToken = {
  async create(data: {
    userId: any;
    tokenHash: string;
    family: string;
    isRevoked: boolean;
    expiresAt: Date;
  }): Promise<InMemoryRefreshTokenDoc> {
    const id = generateHexId();
    const doc: InMemoryRefreshTokenDoc = {
      _id: id,
      userId: data.userId,
      tokenHash: data.tokenHash,
      family: data.family,
      isRevoked: data.isRevoked,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      async save(): Promise<InMemoryRefreshTokenDoc> {
        this.updatedAt = new Date();
        refreshTokensMap.set(this._id, this);
        return this;
      },
    };

    refreshTokensMap.set(id, doc);
    return doc;
  },

  findOne(query: { tokenHash?: string }) {
    const findPromise = (async () => {
      for (const r of refreshTokensMap.values()) {
        if (r.tokenHash === query.tokenHash) {
          const userDoc = await memoryUser.findById(r.userId.toString());
          return {
            ...r,
            userId: userDoc,
            async save() {
              return r.save();
            },
          };
        }
      }
      return null;
    })();

    return Object.assign(findPromise, {
      populate: () => findPromise,
    });
  },

  async updateOne(query: { tokenHash?: string }, update: { $set: { isRevoked?: boolean } }): Promise<void> {
    for (const r of refreshTokensMap.values()) {
      if (r.tokenHash === query.tokenHash) {
        if (update.$set.isRevoked !== undefined) {
          r.isRevoked = update.$set.isRevoked;
        }
      }
    }
  },

  async updateMany(query: { family?: string; userId?: any }, update: { $set: { isRevoked?: boolean } }): Promise<void> {
    for (const r of refreshTokensMap.values()) {
      const matchFamily = query.family ? r.family === query.family : true;
      const matchUser = query.userId ? r.userId.toString() === query.userId.toString() : true;
      if (matchFamily && matchUser) {
        if (update.$set.isRevoked !== undefined) {
          r.isRevoked = update.$set.isRevoked;
        }
      }
    }
  },
};

// ============================================================================
// MEMORY SAFETY PREDICTION STORE
// ============================================================================
export const memorySafetyPrediction = {
  async create(data: any): Promise<InMemorySafetyPredictionDoc> {
    // Idempotency check: if clientRequestId already exists, return existing
    if (data.clientRequestId) {
      for (const p of predictionsMap.values()) {
        if (p.clientRequestId === data.clientRequestId) {
          return p;
        }
      }
    }

    // Validation
    const { factors, safety_score } = data;
    if (!factors || factors.lighting === undefined || factors.crime_risk === undefined) {
      const err = new Error('SafetyPrediction validation failed: Missing required safety factors');
      (err as any).name = 'ValidationError';
      throw err;
    }

    if (factors.lighting < 0 || factors.lighting > 10) {
      const err = new Error('SafetyPrediction validation failed: Lighting factor must be between 0 and 10');
      (err as any).name = 'ValidationError';
      throw err;
    }

    if (safety_score < 0 || safety_score > 100) {
      const err = new Error('SafetyPrediction validation failed: Safety score must be between 0 and 100');
      (err as any).name = 'ValidationError';
      throw err;
    }

    const id = generateHexId();
    const doc: InMemorySafetyPredictionDoc = {
      _id: id,
      user: data.user || null,
      clientRequestId: data.clientRequestId,
      origin: data.origin,
      destination: data.destination,
      departureTime: data.departureTime || 'Immediate',
      travelMode: data.travelMode || 'walking',
      factors: {
        lighting: Number(factors.lighting),
        crime_risk: Number(factors.crime_risk),
        accident_risk: Number(factors.accident_risk),
        crowd_level: Number(factors.crowd_level),
      },
      safety_score: Number(safety_score),
      prediction_details: data.prediction_details || {
        classification: safety_score >= 80 ? 'Safe' : safety_score >= 50 ? 'Moderate Caution' : 'High Caution',
        recommendation: 'Evaluate route with caution.',
      },
      model_info: data.model_info || {
        model_name: 'SafeRoute RandomForestClassifier',
        version: 'v1.0.0',
        data_source: 'SafeRoute Municipal Open Crime & Infrastructure Registry',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      async save(): Promise<InMemorySafetyPredictionDoc> {
        this.updatedAt = new Date();
        predictionsMap.set(this._id, this);
        return this;
      },
    };

    predictionsMap.set(id, doc);
    return doc;
  },

  find(query?: any) {
    const listPromise = (async () => {
      let results = Array.from(predictionsMap.values());
      if (query?.user) {
        results = results.filter((p) => p.user?.toString() === query.user.toString());
      }
      return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    })();

    const queryObj = {
      sort: () => queryObj,
      limit: (count: number) => {
        const limited = listPromise.then((res) => res.slice(0, count));
        return Object.assign(limited, queryObj);
      },
      then: listPromise.then.bind(listPromise),
      catch: listPromise.catch.bind(listPromise),
      finally: listPromise.finally.bind(listPromise),
    };

    return queryObj;
  },

  async findById(id: string): Promise<InMemorySafetyPredictionDoc | null> {
    return predictionsMap.get(id.toString()) || null;
  },

  async findOne(query: { clientRequestId?: string; _id?: string }): Promise<InMemorySafetyPredictionDoc | null> {
    if (query?._id) return predictionsMap.get(query._id.toString()) || null;
    if (query?.clientRequestId) {
      for (const p of predictionsMap.values()) {
        if (p.clientRequestId === query.clientRequestId) return p;
      }
    }
    return null;
  },

  async countDocuments(query?: any): Promise<number> {
    let results = Array.from(predictionsMap.values());
    if (query?.user) {
      results = results.filter((p) => p.user?.toString() === query.user.toString());
    }
    return results.length;
  },
};

// ============================================================================
// MEMORY ROUTE HISTORY STORE
// ============================================================================
export const memoryRouteHistory = {
  async create(data: any): Promise<InMemoryRouteHistoryDoc> {
    // Idempotency check
    if (data.clientRequestId) {
      for (const r of routeHistoriesMap.values()) {
        if (r.clientRequestId === data.clientRequestId) {
          return r;
        }
      }
    }

    // Validation: Require route data to be present
    if (!data.origin?.name || !data.destination?.name) {
      const err = new Error('RouteHistory validation failed: Origin and Destination names are required');
      (err as any).name = 'ValidationError';
      throw err;
    }

    if (!data.selectedRoute || !data.selectedRoute.routeName || !data.selectedRoute.travelMode) {
      const err = new Error('RouteHistory validation failed: selectedRoute must contain routeName and travelMode');
      (err as any).name = 'ValidationError';
      throw err;
    }

    const id = generateHexId();
    const doc: InMemoryRouteHistoryDoc = {
      _id: id,
      user: data.user || null,
      predictionId: data.predictionId || null,
      clientRequestId: data.clientRequestId,
      origin: {
        name: data.origin.name,
        coordinates: data.origin.coordinates,
      },
      destination: {
        name: data.destination.name,
        coordinates: data.destination.coordinates,
      },
      selectedRoute: {
        routeName: data.selectedRoute.routeName,
        travelMode: data.selectedRoute.travelMode,
        distanceText: data.selectedRoute.distanceText,
        durationText: data.selectedRoute.durationText,
        safetyScore: data.selectedRoute.safetyScore ?? 80,
        waypoints: data.selectedRoute.waypoints || [],
        polyline: data.selectedRoute.polyline,
        summary: data.selectedRoute.summary,
      },
      status: data.status || 'selected',
      createdAt: new Date(),
      updatedAt: new Date(),
      async save(): Promise<InMemoryRouteHistoryDoc> {
        this.updatedAt = new Date();
        routeHistoriesMap.set(this._id, this);
        return this;
      },
    };

    routeHistoriesMap.set(id, doc);
    return doc;
  },

  find(query?: any) {
    const listPromise = (async () => {
      let results = Array.from(routeHistoriesMap.values());
      if (query?.user) {
        results = results.filter((r) => r.user?.toString() === query.user.toString());
      }
      return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    })();

    const queryObj = {
      sort: () => queryObj,
      limit: (count: number) => {
        const limited = listPromise.then((res) => res.slice(0, count));
        return Object.assign(limited, queryObj);
      },
      then: listPromise.then.bind(listPromise),
      catch: listPromise.catch.bind(listPromise),
      finally: listPromise.finally.bind(listPromise),
    };

    return queryObj;
  },

  async findById(id: string): Promise<InMemoryRouteHistoryDoc | null> {
    return routeHistoriesMap.get(id.toString()) || null;
  },

  async findByIdAndDelete(id: string): Promise<InMemoryRouteHistoryDoc | null> {
    const doc = routeHistoriesMap.get(id.toString());
    if (!doc) return null;
    routeHistoriesMap.delete(id.toString());
    return doc;
  },

  async countDocuments(query?: any): Promise<number> {
    let results = Array.from(routeHistoriesMap.values());
    if (query?.user) {
      results = results.filter((r) => r.user?.toString() === query.user.toString());
    }
    return results.length;
  },
};

// ============================================================================
// MEMORY AUDIT LOG STORE
// ============================================================================
export const memoryAuditLog = {
  async create(data: any): Promise<InMemoryAuditLogDoc> {
    if (!data.action) {
      const err = new Error('AuditLog validation failed: action is required');
      (err as any).name = 'ValidationError';
      throw err;
    }

    const id = generateHexId();
    const doc: InMemoryAuditLogDoc = {
      _id: id,
      action: data.action,
      actor: data.actor || {},
      target: data.target || { resourceType: 'System' },
      status: data.status || 'SUCCESS',
      metadata: data.metadata,
      errorMessage: data.errorMessage,
      createdAt: new Date(),
    };

    auditLogsMap.set(id, doc);
    return doc;
  },

  find(query?: any) {
    const listPromise = (async () => {
      let results = Array.from(auditLogsMap.values());
      if (query?.action) {
        results = results.filter((a) => a.action === query.action);
      }
      return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    })();

    const queryObj = {
      sort: () => queryObj,
      limit: (count: number) => {
        const limited = listPromise.then((res) => res.slice(0, count));
        return Object.assign(limited, queryObj);
      },
      then: listPromise.then.bind(listPromise),
      catch: listPromise.catch.bind(listPromise),
      finally: listPromise.finally.bind(listPromise),
    };

    return queryObj;
  },

  async countDocuments(query?: any): Promise<number> {
    let results = Array.from(auditLogsMap.values());
    if (query?.action) {
      results = results.filter((a) => a.action === query.action);
    }
    return results.length;
  },
};

// ============================================================================
// GEOSPATIAL HELPER (HAVERSINE DISTANCE IN METERS)
// ============================================================================
function calculateHaversineMeters(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const r = 6371000.0; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2.0) ** 2 +
    Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dLon / 2.0) ** 2;
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  return Math.round(r * c * 10) / 10;
}

function matchDoc(doc: any, query: any): boolean {
  if (!query || Object.keys(query).length === 0) return true;
  for (const [key, expected] of Object.entries(query)) {
    if (key === '$or' && Array.isArray(expected)) {
      const orMatched = expected.some((cond) => matchDoc(doc, cond));
      if (!orMatched) return false;
      continue;
    }
    if (key === '$and' && Array.isArray(expected)) {
      const andMatched = expected.every((cond) => matchDoc(doc, cond));
      if (!andMatched) return false;
      continue;
    }
    const actual = doc[key];
    if (expected instanceof RegExp) {
      if (Array.isArray(actual)) {
        if (!actual.some((item) => (expected as RegExp).test(String(item)))) return false;
      } else if (typeof actual === 'string') {
        if (!(expected as RegExp).test(actual)) return false;
      } else {
        return false;
      }
      continue;
    }
    if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
      const expObj = expected as Record<string, any>;
      if ('$regex' in expObj) {
        const pattern = typeof expObj.$regex === 'string' ? expObj.$regex : expObj.$regex.source;
        const flags = expObj.$options || '';
        try {
          const re = new RegExp(pattern, flags);
          if (Array.isArray(actual)) {
            if (!actual.some((item) => re.test(String(item)))) return false;
          } else if (typeof actual === 'string') {
            if (!re.test(actual)) return false;
          } else {
            return false;
          }
        } catch {
          return false;
        }
      } else if ('$in' in expObj && Array.isArray(expObj.$in)) {
        if (!expObj.$in.includes(actual)) return false;
      } else if ('$nin' in expObj && Array.isArray(expObj.$nin)) {
        if (!expObj.$nin.includes(actual)) return false;
      } else if ('$ne' in expObj) {
        if (actual === expObj.$ne) return false;
      } else if ('$gte' in expObj) {
        if (actual < expObj.$gte) return false;
      } else if ('$lte' in expObj) {
        if (actual > expObj.$lte) return false;
      } else if ('$gt' in expObj) {
        if (actual <= expObj.$gt) return false;
      } else if ('$lt' in expObj) {
        if (actual >= expObj.$lt) return false;
      } else {
        if (actual !== expected) return false;
      }
    } else {
      if (actual !== expected) return false;
    }
  }
  return true;
}

// ============================================================================
// MEMORY SAFETY RECORD STORE
// ============================================================================
function validateSafetyRecordData(data: any): void {
  const coords = data?.location?.coordinates;
  if (
    !data?.location ||
    data.location.type !== 'Point' ||
    !Array.isArray(coords) ||
    coords.length !== 2 ||
    typeof coords[0] !== 'number' ||
    typeof coords[1] !== 'number' ||
    isNaN(coords[0]) ||
    isNaN(coords[1]) ||
    coords[0] < -180 ||
    coords[0] > 180 ||
    coords[1] < -90 ||
    coords[1] > 90
  ) {
    const err = new Error(
      'SafetyRecord validation failed: Coordinates must be valid [longitude, latitude] where longitude is between -180 and 180, and latitude is between -90 and 90'
    );
    (err as any).name = 'ValidationError';
    throw err;
  }

  if (!data.factor || typeof data.factor !== 'string' || !data.factor.trim()) {
    const err = new Error('SafetyRecord validation failed: Safety factor category is required');
    (err as any).name = 'ValidationError';
    throw err;
  }

  if (typeof data.value !== 'number' || isNaN(data.value) || data.value < 0 || data.value > 100) {
    const err = new Error('SafetyRecord validation failed: Factor value must be a number between 0 and 100');
    (err as any).name = 'ValidationError';
    throw err;
  }

  if (!data.source || typeof data.source !== 'string' || !data.source.trim()) {
    const err = new Error('SafetyRecord validation failed: Data source is required');
    (err as any).name = 'ValidationError';
    throw err;
  }
}

function createSafetyDoc(id: string, data: any): InMemorySafetyRecordDoc {
  validateSafetyRecordData(data);
  const now = new Date();
  const doc: InMemorySafetyRecordDoc = {
    _id: id,
    location: {
      type: 'Point',
      coordinates: [data.location.coordinates[0], data.location.coordinates[1]],
    },
    factor: data.factor.trim(),
    value: data.value,
    source: data.source.trim(),
    isSample: data.isSample !== undefined ? Boolean(data.isSample) : false,
    externalId: data.externalId ? data.externalId.trim() : undefined,
    metadata: data.metadata || {},
    createdAt: data.createdAt ? new Date(data.createdAt) : now,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : now,
    async save(): Promise<InMemorySafetyRecordDoc> {
      validateSafetyRecordData(this);
      this.updatedAt = new Date();
      safetyRecordsMap.set(this._id, this);
      return this;
    },
    toJSON() {
      return { ...this };
    },
    toObject() {
      return { ...this };
    },
  };
  return doc;
}

export const memorySafetyRecord = {
  async init() {
    return Promise.resolve();
  },

  async create(data: any): Promise<InMemorySafetyRecordDoc> {
    const id = generateHexId();
    const doc = createSafetyDoc(id, data);
    safetyRecordsMap.set(id, doc);
    return doc;
  },

  async insertMany(docs: any[]): Promise<InMemorySafetyRecordDoc[]> {
    const created: InMemorySafetyRecordDoc[] = [];
    for (const d of docs) {
      const doc = await this.create(d);
      created.push(doc);
    }
    return created;
  },

  find(query?: any) {
    const listPromise = (async () => {
      let results = Array.from(safetyRecordsMap.values());
      if (query) {
        results = results.filter((r) => matchDoc(r, query));
      }
      return results;
    })();

    const queryObj = {
      lean: () => queryObj,
      select: () => queryObj,
      sort: () => queryObj,
      limit: (count: number) => {
        const limited = listPromise.then((res) => res.slice(0, count));
        return Object.assign(limited, queryObj);
      },
      skip: (count: number) => {
        const skipped = listPromise.then((res) => res.slice(count));
        return Object.assign(skipped, queryObj);
      },
      then: listPromise.then.bind(listPromise),
      catch: listPromise.catch.bind(listPromise),
      finally: listPromise.finally.bind(listPromise),
    };

    return queryObj;
  },

  async findOne(query: any): Promise<InMemorySafetyRecordDoc | null> {
    for (const r of safetyRecordsMap.values()) {
      if (matchDoc(r, query)) {
        return r;
      }
    }
    return null;
  },

  async findOneAndUpdate(filter: any, update: any, options?: any): Promise<InMemorySafetyRecordDoc | null> {
    let existing: InMemorySafetyRecordDoc | null = null;
    for (const r of safetyRecordsMap.values()) {
      if (matchDoc(r, filter)) {
        existing = r;
        break;
      }
    }

    if (!existing && options?.upsert) {
      const rawData = {
        ...filter,
        ...(update.$set || update),
        ...(update.$setOnInsert || {}),
      };
      const id = generateHexId();
      const newDoc = createSafetyDoc(id, rawData);
      safetyRecordsMap.set(id, newDoc);
      return newDoc;
    }

    if (existing) {
      const patch = update.$set || update;
      if (patch.location) existing.location = patch.location;
      if (patch.factor !== undefined) existing.factor = patch.factor;
      if (patch.value !== undefined) existing.value = patch.value;
      if (patch.source !== undefined) existing.source = patch.source;
      if (patch.isSample !== undefined) existing.isSample = patch.isSample;
      if (patch.metadata !== undefined) existing.metadata = patch.metadata;
      validateSafetyRecordData(existing);
      existing.updatedAt = new Date();
      safetyRecordsMap.set(existing._id, existing);
      return existing;
    }

    return null;
  },

  async bulkWrite(ops: any[]): Promise<any> {
    let matchedCount = 0;
    let modifiedCount = 0;
    let upsertedCount = 0;
    const upsertedIds: Record<number, string> = {};

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      if (op.updateOne) {
        const { filter, update, upsert } = op.updateOne;
        let matched: InMemorySafetyRecordDoc | null = null;
        for (const r of safetyRecordsMap.values()) {
          if (matchDoc(r, filter)) {
            matched = r;
            break;
          }
        }
        if (matched) {
          matchedCount++;
          const patch = update.$set || update;
          if (patch.location) matched.location = patch.location;
          if (patch.factor !== undefined) matched.factor = patch.factor;
          if (patch.value !== undefined) matched.value = patch.value;
          if (patch.source !== undefined) matched.source = patch.source;
          if (patch.isSample !== undefined) matched.isSample = patch.isSample;
          if (patch.metadata !== undefined) matched.metadata = patch.metadata;
          matched.updatedAt = new Date();
          safetyRecordsMap.set(matched._id, matched);
          modifiedCount++;
        } else if (upsert) {
          const rawData = {
            ...filter,
            ...(update.$set || update),
            ...(update.$setOnInsert || {}),
          };
          const id = generateHexId();
          const newDoc = createSafetyDoc(id, rawData);
          safetyRecordsMap.set(id, newDoc);
          upsertedCount++;
          upsertedIds[i] = id;
        }
      }
    }

    return {
      ok: 1,
      matchedCount,
      modifiedCount,
      upsertedCount,
      upsertedIds,
    };
  },

  async countDocuments(query?: any): Promise<number> {
    if (!query || Object.keys(query).length === 0) {
      return safetyRecordsMap.size;
    }
    let count = 0;
    for (const r of safetyRecordsMap.values()) {
      if (matchDoc(r, query)) count++;
    }
    return count;
  },

  async deleteOne(query?: any): Promise<{ deletedCount: number }> {
    for (const [id, r] of safetyRecordsMap.entries()) {
      if (matchDoc(r, query)) {
        safetyRecordsMap.delete(id);
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  },

  async deleteMany(query?: any): Promise<{ deletedCount: number }> {
    if (!query || Object.keys(query).length === 0) {
      const count = safetyRecordsMap.size;
      safetyRecordsMap.clear();
      return { deletedCount: count };
    }
    let count = 0;
    for (const [id, r] of safetyRecordsMap.entries()) {
      if (matchDoc(r, query)) {
        safetyRecordsMap.delete(id);
        count++;
      }
    }
    return { deletedCount: count };
  },

  async aggregate(pipeline: any[]): Promise<any[]> {
    let records: any[] = Array.from(safetyRecordsMap.values()).map((r) => ({
      _id: r._id,
      location: { ...r.location, coordinates: [...r.location.coordinates] },
      factor: r.factor,
      value: r.value,
      source: r.source,
      isSample: r.isSample,
      externalId: r.externalId,
      metadata: r.metadata ? { ...r.metadata } : {},
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    for (const stage of pipeline) {
      if (stage.$geoNear) {
        const geoNear = stage.$geoNear;
        const targetCoords = geoNear.near?.coordinates || geoNear.near;
        if (!Array.isArray(targetCoords) || targetCoords.length !== 2) {
          throw new Error('$geoNear: near coordinates must be [longitude, latitude]');
        }
        const [targetLon, targetLat] = targetCoords;
        const distanceField = geoNear.distanceField || 'distance';
        const maxDistance = geoNear.maxDistance !== undefined ? geoNear.maxDistance : Infinity;
        const minDistance = geoNear.minDistance !== undefined ? geoNear.minDistance : 0;

        if (geoNear.query) {
          records = records.filter((r) => matchDoc(r, geoNear.query));
        }

        const withDist = records.map((r) => {
          const [rLon, rLat] = r.location.coordinates;
          const dist = calculateHaversineMeters(targetLon, targetLat, rLon, rLat);
          return {
            ...r,
            [distanceField]: dist,
          };
        });

        records = withDist
          .filter((r) => r[distanceField] >= minDistance && r[distanceField] <= maxDistance)
          .sort((a, b) => a[distanceField] - b[distanceField]);
      } else if (stage.$match) {
        records = records.filter((r) => matchDoc(r, stage.$match));
      } else if (stage.$limit) {
        records = records.slice(0, stage.$limit);
      } else if (stage.$skip) {
        records = records.slice(stage.$skip);
      }
    }

    return records;
  },
};

// ============================================================================
// MEMORY EMERGENCY LOCATION STORE
// ============================================================================
const VALID_EMERGENCY_TYPES = ['hospital', 'police', 'fire_station', 'emergency_care', 'other'];

function validateEmergencyData(data: any): void {
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    const err = new Error('EmergencyLocation validation failed: Facility name is required');
    (err as any).name = 'ValidationError';
    throw err;
  }

  if (!data.type || !VALID_EMERGENCY_TYPES.includes(data.type)) {
    const err = new Error(
      'EmergencyLocation validation failed: Type must be hospital, police, fire_station, emergency_care, or other'
    );
    (err as any).name = 'ValidationError';
    throw err;
  }

  const coords = data?.location?.coordinates;
  if (
    !data?.location ||
    data.location.type !== 'Point' ||
    !Array.isArray(coords) ||
    coords.length !== 2 ||
    typeof coords[0] !== 'number' ||
    typeof coords[1] !== 'number' ||
    isNaN(coords[0]) ||
    isNaN(coords[1]) ||
    coords[0] < -180 ||
    coords[0] > 180 ||
    coords[1] < -90 ||
    coords[1] > 90
  ) {
    const err = new Error('EmergencyLocation validation failed: Coordinates must be valid [longitude, latitude]');
    (err as any).name = 'ValidationError';
    throw err;
  }

  if (!data.source || typeof data.source !== 'string' || !data.source.trim()) {
    const err = new Error('EmergencyLocation validation failed: Source identifier is required');
    (err as any).name = 'ValidationError';
    throw err;
  }
}

function createEmergencyDoc(id: string, data: any): InMemoryEmergencyLocationDoc {
  validateEmergencyData(data);
  const now = new Date();
  const doc: InMemoryEmergencyLocationDoc = {
    _id: id,
    name: data.name.trim(),
    type: data.type,
    location: {
      type: 'Point',
      coordinates: [data.location.coordinates[0], data.location.coordinates[1]],
    },
    phone: data.phone ? data.phone.trim() : undefined,
    source: data.source ? data.source.trim() : 'openstreetmap',
    osmId: data.osmId ? data.osmId.trim() : undefined,
    address: data.address ? data.address.trim() : undefined,
    isSample: data.isSample !== undefined ? Boolean(data.isSample) : false,
    createdAt: data.createdAt ? new Date(data.createdAt) : now,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : now,
    async save(): Promise<InMemoryEmergencyLocationDoc> {
      validateEmergencyData(this);
      this.updatedAt = new Date();
      emergencyLocationsMap.set(this._id, this);
      return this;
    },
    toJSON() {
      return { ...this };
    },
    toObject() {
      return { ...this };
    },
  };
  return doc;
}

export const memoryEmergencyLocation = {
  async init() {
    return Promise.resolve();
  },

  async create(data: any): Promise<InMemoryEmergencyLocationDoc> {
    const id = generateHexId();
    const doc = createEmergencyDoc(id, data);
    emergencyLocationsMap.set(id, doc);
    return doc;
  },

  async insertMany(docs: any[]): Promise<InMemoryEmergencyLocationDoc[]> {
    const created: InMemoryEmergencyLocationDoc[] = [];
    for (const d of docs) {
      const doc = await this.create(d);
      created.push(doc);
    }
    return created;
  },

  find(query?: any) {
    const listPromise = (async () => {
      let results = Array.from(emergencyLocationsMap.values());
      if (query) {
        results = results.filter((r) => matchDoc(r, query));
      }
      return results;
    })();

    const queryObj = {
      lean: () => queryObj,
      select: () => queryObj,
      sort: () => queryObj,
      limit: (count: number) => {
        const limited = listPromise.then((res) => res.slice(0, count));
        return Object.assign(limited, queryObj);
      },
      skip: (count: number) => {
        const skipped = listPromise.then((res) => res.slice(count));
        return Object.assign(skipped, queryObj);
      },
      then: listPromise.then.bind(listPromise),
      catch: listPromise.catch.bind(listPromise),
      finally: listPromise.finally.bind(listPromise),
    };

    return queryObj;
  },

  async findOne(query: any): Promise<InMemoryEmergencyLocationDoc | null> {
    for (const r of emergencyLocationsMap.values()) {
      if (matchDoc(r, query)) {
        return r;
      }
    }
    return null;
  },

  async findOneAndUpdate(filter: any, update: any, options?: any): Promise<InMemoryEmergencyLocationDoc | null> {
    let existing: InMemoryEmergencyLocationDoc | null = null;
    for (const r of emergencyLocationsMap.values()) {
      if (matchDoc(r, filter)) {
        existing = r;
        break;
      }
    }

    if (!existing && options?.upsert) {
      const rawData = {
        ...filter,
        ...(update.$set || update),
        ...(update.$setOnInsert || {}),
      };
      const id = generateHexId();
      const newDoc = createEmergencyDoc(id, rawData);
      emergencyLocationsMap.set(id, newDoc);
      return newDoc;
    }

    if (existing) {
      const patch = update.$set || update;
      if (patch.name !== undefined) existing.name = patch.name;
      if (patch.type !== undefined) existing.type = patch.type;
      if (patch.location) existing.location = patch.location;
      if (patch.phone !== undefined) existing.phone = patch.phone;
      if (patch.source !== undefined) existing.source = patch.source;
      if (patch.osmId !== undefined) existing.osmId = patch.osmId;
      if (patch.address !== undefined) existing.address = patch.address;
      if (patch.isSample !== undefined) existing.isSample = patch.isSample;
      validateEmergencyData(existing);
      existing.updatedAt = new Date();
      emergencyLocationsMap.set(existing._id, existing);
      return existing;
    }

    return null;
  },

  async bulkWrite(ops: any[]): Promise<any> {
    let matchedCount = 0;
    let modifiedCount = 0;
    let upsertedCount = 0;
    const upsertedIds: Record<number, string> = {};

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      if (op.updateOne) {
        const { filter, update, upsert } = op.updateOne;
        let matched: InMemoryEmergencyLocationDoc | null = null;
        for (const r of emergencyLocationsMap.values()) {
          if (matchDoc(r, filter)) {
            matched = r;
            break;
          }
        }
        if (matched) {
          matchedCount++;
          const patch = update.$set || update;
          if (patch.name !== undefined) matched.name = patch.name;
          if (patch.type !== undefined) matched.type = patch.type;
          if (patch.location) matched.location = patch.location;
          if (patch.phone !== undefined) matched.phone = patch.phone;
          if (patch.source !== undefined) matched.source = patch.source;
          if (patch.osmId !== undefined) matched.osmId = patch.osmId;
          if (patch.address !== undefined) matched.address = patch.address;
          if (patch.isSample !== undefined) matched.isSample = patch.isSample;
          matched.updatedAt = new Date();
          emergencyLocationsMap.set(matched._id, matched);
          modifiedCount++;
        } else if (upsert) {
          const rawData = {
            ...filter,
            ...(update.$set || update),
            ...(update.$setOnInsert || {}),
          };
          const id = generateHexId();
          const newDoc = createEmergencyDoc(id, rawData);
          emergencyLocationsMap.set(id, newDoc);
          upsertedCount++;
          upsertedIds[i] = id;
        }
      }
    }

    return {
      ok: 1,
      matchedCount,
      modifiedCount,
      upsertedCount,
      upsertedIds,
    };
  },

  async countDocuments(query?: any): Promise<number> {
    if (!query || Object.keys(query).length === 0) {
      return emergencyLocationsMap.size;
    }
    let count = 0;
    for (const r of emergencyLocationsMap.values()) {
      if (matchDoc(r, query)) count++;
    }
    return count;
  },

  async deleteOne(query?: any): Promise<{ deletedCount: number }> {
    for (const [id, r] of emergencyLocationsMap.entries()) {
      if (matchDoc(r, query)) {
        emergencyLocationsMap.delete(id);
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  },

  async deleteMany(query?: any): Promise<{ deletedCount: number }> {
    if (!query || Object.keys(query).length === 0) {
      const count = emergencyLocationsMap.size;
      emergencyLocationsMap.clear();
      return { deletedCount: count };
    }
    let count = 0;
    for (const [id, r] of emergencyLocationsMap.entries()) {
      if (matchDoc(r, query)) {
        emergencyLocationsMap.delete(id);
        count++;
      }
    }
    return { deletedCount: count };
  },

  async aggregate(pipeline: any[]): Promise<any[]> {
    let records: any[] = Array.from(emergencyLocationsMap.values()).map((r) => ({
      _id: r._id,
      name: r.name,
      type: r.type,
      location: { ...r.location, coordinates: [...r.location.coordinates] },
      phone: r.phone,
      source: r.source,
      osmId: r.osmId,
      address: r.address,
      isSample: r.isSample,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    for (const stage of pipeline) {
      if (stage.$geoNear) {
        const geoNear = stage.$geoNear;
        const targetCoords = geoNear.near?.coordinates || geoNear.near;
        if (!Array.isArray(targetCoords) || targetCoords.length !== 2) {
          throw new Error('$geoNear: near coordinates must be [longitude, latitude]');
        }
        const [targetLon, targetLat] = targetCoords;
        const distanceField = geoNear.distanceField || 'distance';
        const maxDistance = geoNear.maxDistance !== undefined ? geoNear.maxDistance : Infinity;
        const minDistance = geoNear.minDistance !== undefined ? geoNear.minDistance : 0;

        if (geoNear.query) {
          records = records.filter((r) => matchDoc(r, geoNear.query));
        }

        const withDist = records.map((r) => {
          const [rLon, rLat] = r.location.coordinates;
          const dist = calculateHaversineMeters(targetLon, targetLat, rLon, rLat);
          return {
            ...r,
            [distanceField]: dist,
          };
        });

        records = withDist
          .filter((r) => r[distanceField] >= minDistance && r[distanceField] <= maxDistance)
          .sort((a, b) => a[distanceField] - b[distanceField]);
      } else if (stage.$match) {
        records = records.filter((r) => matchDoc(r, stage.$match));
      } else if (stage.$limit) {
        records = records.slice(0, stage.$limit);
      } else if (stage.$skip) {
        records = records.slice(stage.$skip);
      }
    }

    return records;
  },
};

// ============================================================================
// MEMORY CUSTOM PLACES STORE
// ============================================================================
function createCustomPlaceDoc(id: string, data: any): InMemoryCustomPlaceDoc {
  const now = new Date();
  const lng = Number(data.lng ?? data.location?.coordinates?.[0]);
  const lat = Number(data.lat ?? data.location?.coordinates?.[1]);

  return {
    _id: id,
    name: (data.name || '').trim(),
    aliases: Array.isArray(data.aliases) ? data.aliases : [],
    category: data.category || 'residential_society',
    pinType: data.pinType || 'general_place',
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    lat,
    lng,
    address: data.address ? data.address.trim() : undefined,
    locality: data.locality ? data.locality.trim() : undefined,
    city: data.city ? data.city.trim() : undefined,
    state: data.state ? data.state.trim() : 'Maharashtra',
    postcode: data.postcode ? data.postcode.trim() : undefined,
    landmark: data.landmark ? data.landmark.trim() : undefined,
    description: data.description ? data.description.trim() : undefined,
    creatorName: data.creatorName || 'Community User',
    creatorId: data.creatorId || null,
    source: data.source || 'user_manual_pin',
    verificationStatus: data.verificationStatus || 'community_submitted',
    reportCount: data.reportCount || 0,
    reportReasons: data.reportReasons || [],
    isPublic: data.isPublic !== undefined ? Boolean(data.isPublic) : true,
    createdAt: data.createdAt ? new Date(data.createdAt) : now,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : now,
    async save(): Promise<InMemoryCustomPlaceDoc> {
      this.updatedAt = new Date();
      customPlacesMap.set(this._id, this);
      return this;
    },
    toJSON() {
      return { ...this };
    },
    toObject() {
      return { ...this };
    },
  };
}

// Seed initial memory places around Thorala Paduka Temple / Alandi / Pune
const INITIAL_MEMORY_PLACES = [
  {
    id: 'cp_saiangel_society',
    name: 'Saiangel Society',
    aliases: ['Sai Angel Society', 'Saiangel', 'Sai Angel', 'साई एंजेल सोसायटी'],
    category: 'residential_society',
    pinType: 'complex_gate',
    lat: 18.642953,
    lng: 73.876243,
    address: 'Saiangel Society, Sant Dnyaneshwar Marg, Near Thorala Paduka Temple, Bhosari / Dighi, Pune, Maharashtra 411039',
    locality: 'Bhosari / Dighi, Alandi Road',
    city: 'Pimpri-Chinchwad, Pune',
    state: 'Maharashtra',
    postcode: '411039',
    landmark: 'Near Thorya / Thorala Paduka Temple',
    description: 'Residential gated housing society near Thorala Paduka Temple on Alandi Road.',
    source: 'verified_partner',
    verificationStatus: 'verified',
  },
  {
    id: 'cp_saiangel_gate',
    name: 'Saiangel Society Main Entrance Gate',
    aliases: ['Saiangel Gate', 'Sai Angel Society Gate'],
    category: 'society_entrance',
    pinType: 'exact_entrance',
    lat: 18.642820,
    lng: 73.876350,
    address: 'Saiangel Society Main Gate, Internal Access Lane off Alandi Road, Bhosari, Pune, Maharashtra 411039',
    locality: 'Bhosari / Dighi',
    city: 'Pimpri-Chinchwad, Pune',
    landmark: 'Facing Thorala Paduka Temple corridor',
    description: 'Vehicle and pedestrian security gate access for Saiangel Society.',
    source: 'verified_partner',
    verificationStatus: 'verified',
  },
  {
    id: 'cp_thorala_paduka',
    name: 'Thorya / Thorala Paduka Temple',
    aliases: ['Thorala Paduka Temple', 'Thorala Paduka', 'Thorya Paduka', 'Thorlya Paduka Temple', 'थोरल्या पादुका मंदिर'],
    category: 'temple_religious',
    pinType: 'general_place',
    lat: 18.6403704,
    lng: 73.8769770,
    address: 'Thorya Paduka Temple, Sant Dyaneshwar Marg Flyover, Bhosari, Pimpri-Chinchwad, Pune, Maharashtra 411039',
    locality: 'Alandi Road, Bhosari',
    city: 'Pimpri-Chinchwad, Pune',
    state: 'Maharashtra',
    postcode: '411039',
    landmark: 'Sant Dnyaneshwar Marg Flyover',
    description: 'Historic Paduka temple marking the sacred Warkari Palkhi pilgrimage route between Alandi and Pandharpur.',
    source: 'verified_partner',
    verificationStatus: 'verified',
  },
  {
    id: 'cp_alandi_samadhi_mandir',
    name: 'Shree Sant Dnyaneshwar Maharaj Sanjeevan Samadhi Mandir, Alandi',
    aliases: ['Alandi Mandir', 'Alandi Samadhi Mandir', 'Dnyaneshwar Samadhi Mandir', 'Sant Dnyaneshwar Mandir', 'Alandi Temple', 'श्री संत ज्ञानेश्वर महाराज समाधी मंदिर'],
    category: 'temple_religious',
    pinType: 'general_place',
    lat: 18.6760109,
    lng: 73.8964305,
    address: 'Shree Dnyaneshwar Maharaj Sanjeevan Samadhi Mandir, Alandi Devachi, Khed, Pune, Maharashtra 412105',
    locality: 'Alandi Devachi',
    city: 'Pune',
    state: 'Maharashtra',
    postcode: '412105',
    landmark: 'Indrayani River Ghat',
    description: 'World-renowned sacred pilgrimage shrine and 13th-century samadhi of Sant Dnyaneshwar Maharaj.',
    source: 'verified_partner',
    verificationStatus: 'verified',
  },
  {
    id: 'cp_alandi_police_chowky',
    name: 'Alandi Police Chowky',
    aliases: ['Alandi Police Station'],
    category: 'junction_lane',
    pinType: 'general_place',
    lat: 18.6755,
    lng: 73.8972,
    address: 'Alandi Police Chowky, Near Municipal Council, Alandi, Pune, Maharashtra 412105',
    locality: 'Alandi Town',
    city: 'Pune',
    state: 'Maharashtra',
    landmark: 'Near Alandi Bus Stand',
    source: 'verified_partner',
    verificationStatus: 'verified',
  },
  {
    id: 'cp_bhosari_police_station',
    name: 'Bhosari Police Station',
    aliases: ['Bhosari Police'],
    category: 'hospital_clinic',
    pinType: 'general_place',
    lat: 18.6256,
    lng: 73.8505,
    address: 'Bhosari Police Station, MIDC Bhosari, Pimpri-Chinchwad, Pune, Maharashtra 411026',
    locality: 'Bhosari MIDC',
    city: 'Pimpri-Chinchwad, Pune',
    source: 'verified_partner',
    verificationStatus: 'verified',
  },
];

for (const p of INITIAL_MEMORY_PLACES) {
  const doc = createCustomPlaceDoc(p.id, p);
  customPlacesMap.set(p.id, doc);
}

export const memoryCustomPlace = {
  async init() {
    return Promise.resolve();
  },

  async create(data: any): Promise<InMemoryCustomPlaceDoc> {
    const id = generateHexId();
    const doc = createCustomPlaceDoc(id, data);
    customPlacesMap.set(id, doc);
    return doc;
  },

  async insertMany(docs: any[]): Promise<InMemoryCustomPlaceDoc[]> {
    const created: InMemoryCustomPlaceDoc[] = [];
    for (const d of docs) {
      const doc = await this.create(d);
      created.push(doc);
    }
    return created;
  },

  find(query?: any) {
    let limitCount: number | null = null;
    let skipCount = 0;

    const execute = async () => {
      let results = Array.from(customPlacesMap.values());
      if (query) {
        results = results.filter((r) => matchDoc(r, query));
      }
      if (skipCount > 0) {
        results = results.slice(skipCount);
      }
      if (limitCount !== null) {
        results = results.slice(0, limitCount);
      }
      return results;
    };

    const queryObj: any = {
      lean: () => queryObj,
      select: () => queryObj,
      sort: () => queryObj,
      limit: (count: number) => {
        limitCount = count;
        return queryObj;
      },
      skip: (count: number) => {
        skipCount = count;
        return queryObj;
      },
      then: (onfulfilled?: any, onrejected?: any) => execute().then(onfulfilled, onrejected),
      catch: (onrejected?: any) => execute().catch(onrejected),
      finally: (onfinally?: any) => execute().finally(onfinally),
    };

    return queryObj;
  },

  async findOne(query: any): Promise<InMemoryCustomPlaceDoc | null> {
    for (const r of customPlacesMap.values()) {
      if (matchDoc(r, query)) {
        return r;
      }
    }
    return null;
  },

  async findById(id: string): Promise<InMemoryCustomPlaceDoc | null> {
    return customPlacesMap.get(id.toString()) || null;
  },

  async findByIdAndUpdate(id: string, update: any): Promise<InMemoryCustomPlaceDoc | null> {
    const existing = customPlacesMap.get(id.toString());
    if (!existing) return null;
    const patch = update.$set || update;
    Object.assign(existing, patch);
    if (update.$inc?.reportCount) {
      existing.reportCount = (existing.reportCount || 0) + update.$inc.reportCount;
    }
    if (update.$push?.reportReasons) {
      existing.reportReasons.push(update.$push.reportReasons);
    }
    existing.updatedAt = new Date();
    customPlacesMap.set(id.toString(), existing);
    return existing;
  },

  async countDocuments(query?: any): Promise<number> {
    if (!query || Object.keys(query).length === 0) {
      return customPlacesMap.size;
    }
    let count = 0;
    for (const r of customPlacesMap.values()) {
      if (matchDoc(r, query)) count++;
    }
    return count;
  },

  async deleteOne(query?: any): Promise<{ deletedCount: number }> {
    for (const [id, r] of customPlacesMap.entries()) {
      if (matchDoc(r, query)) {
        customPlacesMap.delete(id);
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  },

  async deleteMany(query?: any): Promise<{ deletedCount: number }> {
    if (!query || Object.keys(query).length === 0) {
      const count = customPlacesMap.size;
      customPlacesMap.clear();
      return { deletedCount: count };
    }
    let count = 0;
    for (const [id, r] of customPlacesMap.entries()) {
      if (matchDoc(r, query)) {
        customPlacesMap.delete(id);
        count++;
      }
    }
    return { deletedCount: count };
  },

  async aggregate(pipeline: any[]): Promise<any[]> {
    let records: any[] = Array.from(customPlacesMap.values()).map((r) => ({
      _id: r._id,
      name: r.name,
      aliases: [...r.aliases],
      category: r.category,
      pinType: r.pinType,
      location: { ...r.location, coordinates: [...r.location.coordinates] },
      lat: r.lat,
      lng: r.lng,
      address: r.address,
      locality: r.locality,
      city: r.city,
      state: r.state,
      landmark: r.landmark,
      description: r.description,
      source: r.source,
      verificationStatus: r.verificationStatus,
      reportCount: r.reportCount,
      reportReasons: r.reportReasons,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    for (const stage of pipeline) {
      if (stage.$geoNear) {
        const geoNear = stage.$geoNear;
        const targetCoords = geoNear.near?.coordinates || geoNear.near;
        if (!Array.isArray(targetCoords) || targetCoords.length !== 2) {
          throw new Error('$geoNear: near coordinates must be [longitude, latitude]');
        }
        const [targetLon, targetLat] = targetCoords;
        const distanceField = geoNear.distanceField || 'distance';
        const maxDistance = geoNear.maxDistance !== undefined ? geoNear.maxDistance : Infinity;
        const minDistance = geoNear.minDistance !== undefined ? geoNear.minDistance : 0;

        if (geoNear.query) {
          records = records.filter((r) => matchDoc(r, geoNear.query));
        }

        const withDist = records.map((r) => {
          const [rLon, rLat] = r.location.coordinates;
          const dist = calculateHaversineMeters(targetLon, targetLat, rLon, rLat);
          return {
            ...r,
            [distanceField]: dist,
          };
        });

        records = withDist
          .filter((r) => r[distanceField] >= minDistance && r[distanceField] <= maxDistance)
          .sort((a, b) => a[distanceField] - b[distanceField]);
      } else if (stage.$match) {
        records = records.filter((r) => matchDoc(r, stage.$match));
      } else if (stage.$limit) {
        records = records.slice(0, stage.$limit);
      } else if (stage.$skip) {
        records = records.slice(stage.$skip);
      }
    }

    return records;
  },
};

// ============================================================================
// MEMORY HAZARD REPORTS STORE
// ============================================================================
function createHazardDoc(id: string, data: any): InMemoryHazardReportDoc {
  const now = new Date();
  const lng = Number(data.lng ?? data.location?.coordinates?.[0]);
  const lat = Number(data.lat ?? data.location?.coordinates?.[1]);

  return {
    _id: id,
    hazardType: data.hazardType || 'broken_streetlight',
    severity: data.severity || 'medium',
    description: (data.description || '').trim(),
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    lat,
    lng,
    landmark: data.landmark ? data.landmark.trim() : undefined,
    reportedBy: data.reportedBy || 'Community User',
    status: data.status || 'active',
    verificationCount: data.verificationCount || 1,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: data.createdAt ? new Date(data.createdAt) : now,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : now,
    async save(): Promise<InMemoryHazardReportDoc> {
      this.updatedAt = new Date();
      hazardReportsMap.set(this._id, this);
      return this;
    },
    toJSON() {
      return { ...this };
    },
    toObject() {
      return { ...this };
    },
  };
}

export const memoryHazardReport = {
  async init() {
    return Promise.resolve();
  },

  async create(data: any): Promise<InMemoryHazardReportDoc> {
    const id = generateHexId();
    const doc = createHazardDoc(id, data);
    hazardReportsMap.set(id, doc);
    return doc;
  },

  find(query?: any) {
    let limitCount: number | null = null;
    let skipCount = 0;

    const execute = async () => {
      let results = Array.from(hazardReportsMap.values());
      if (query) {
        results = results.filter((r) => matchDoc(r, query));
      }
      results = results.filter((r) => r.status === 'active' && r.expiresAt.getTime() > Date.now());
      if (skipCount > 0) {
        results = results.slice(skipCount);
      }
      if (limitCount !== null) {
        results = results.slice(0, limitCount);
      }
      return results;
    };

    const queryObj: any = {
      lean: () => queryObj,
      select: () => queryObj,
      sort: () => queryObj,
      limit: (count: number) => {
        limitCount = count;
        return queryObj;
      },
      skip: (count: number) => {
        skipCount = count;
        return queryObj;
      },
      then: (onfulfilled?: any, onrejected?: any) => execute().then(onfulfilled, onrejected),
      catch: (onrejected?: any) => execute().catch(onrejected),
      finally: (onfinally?: any) => execute().finally(onfinally),
    };

    return queryObj;
  },

  async countDocuments(query?: any): Promise<number> {
    return hazardReportsMap.size;
  },

  async deleteOne(query?: any): Promise<{ deletedCount: number }> {
    for (const [id, r] of hazardReportsMap.entries()) {
      if (matchDoc(r, query)) {
        hazardReportsMap.delete(id);
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  },

  async deleteMany(query?: any): Promise<{ deletedCount: number }> {
    if (!query || Object.keys(query).length === 0) {
      const count = hazardReportsMap.size;
      hazardReportsMap.clear();
      return { deletedCount: count };
    }
    let count = 0;
    for (const [id, r] of hazardReportsMap.entries()) {
      if (matchDoc(r, query)) {
        hazardReportsMap.delete(id);
        count++;
      }
    }
    return { deletedCount: count };
  },
};


