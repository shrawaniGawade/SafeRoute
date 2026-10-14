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

const usersMap = new Map<string, InMemoryUserDoc>();
const otpsMap = new Map<string, InMemoryOtpDoc>();
const refreshTokensMap = new Map<string, InMemoryRefreshTokenDoc>();
const predictionsMap = new Map<string, InMemorySafetyPredictionDoc>();
const routeHistoriesMap = new Map<string, InMemoryRouteHistoryDoc>();
const auditLogsMap = new Map<string, InMemoryAuditLogDoc>();

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
