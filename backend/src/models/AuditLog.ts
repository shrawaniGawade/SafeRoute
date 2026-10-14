import mongoose, { Document, Model, Schema } from 'mongoose';
import { memoryAuditLog } from './memoryStore';

export type AuditAction =
  | 'USER_ROLE_PROMOTED'
  | 'USER_ROLE_DEMOTED'
  | 'USER_DELETED'
  | 'ADMIN_INITIALIZED'
  | 'ADMIN_LOGIN'
  | 'SYSTEM_CONFIG_UPDATED'
  | 'DATABASE_HEALTH_CHECK'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT';

export interface IAuditActor {
  userId?: mongoose.Types.ObjectId | string | null;
  email?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface IAuditTarget {
  resourceType: 'User' | 'SafetyPrediction' | 'RouteHistory' | 'System' | 'Auth';
  resourceId?: string;
  resourceName?: string;
}

export interface IAuditLog extends Document {
  _id: any;
  action: AuditAction | string;
  actor: IAuditActor;
  target: IAuditTarget;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  metadata?: Record<string, any>;
  errorMessage?: string;
  createdAt: Date;
}

// Strictly forbidden keys that must NEVER be persisted in audit logs
const FORBIDDEN_SECRET_KEYS = [
  'password',
  'passwordhash',
  'oldpassword',
  'newpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'tokenhash',
  'secret',
  'jwt_secret',
  'otp',
  'hashedotp',
  'authorization',
  'cookie',
  'set-cookie',
];

/**
 * Recursively scrubs all sensitive authentication secrets, tokens, and credentials from metadata.
 */
export function sanitizeAuditMetadata(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeAuditMetadata);
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_SECRET_KEYS.some((forbidden) => lowerKey.includes(forbidden))) {
      cleaned[key] = '[REDACTED_SECRET]';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeAuditMetadata(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      index: true,
    },
    actor: {
      userId: {
        type: Schema.Types.Mixed,
        default: null,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      role: {
        type: String,
        default: 'unknown',
      },
      ipAddress: {
        type: String,
      },
      userAgent: {
        type: String,
      },
    },
    target: {
      resourceType: {
        type: String,
        required: [true, 'Target resource type is required'],
        enum: ['User', 'SafetyPrediction', 'RouteHistory', 'System', 'Auth'],
      },
      resourceId: {
        type: String,
      },
      resourceName: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING'],
      default: 'SUCCESS',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Audit records are immutable
  }
);

// Pre-save hook: Enforce metadata scrubbing before persistence
AuditLogSchema.pre('save', function () {
  if (this.metadata) {
    this.metadata = sanitizeAuditMetadata(this.metadata);
  }
});

// Indexes for query performance and compliance tracking
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ 'actor.userId': 1, createdAt: -1 });

export const MongoAuditLog: Model<IAuditLog> =
  (mongoose.models.AuditLog as Model<IAuditLog>) ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export const AuditLog: any = new Proxy(MongoAuditLog, {
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop in memoryAuditLog) {
      return (memoryAuditLog as any)[prop];
    }
    return Reflect.get(target, prop, receiver);
  },
});

/**
 * Utility helper to safely record an administrative action
 */
export async function logAdminAction(entry: {
  action: AuditAction | string;
  actor: IAuditActor;
  target: IAuditTarget;
  status?: 'SUCCESS' | 'FAILURE' | 'WARNING';
  metadata?: Record<string, any>;
  errorMessage?: string;
}): Promise<void> {
  try {
    const cleanedMetadata = entry.metadata ? sanitizeAuditMetadata(entry.metadata) : undefined;
    await AuditLog.create({
      action: entry.action,
      actor: entry.actor,
      target: entry.target,
      status: entry.status || 'SUCCESS',
      metadata: cleanedMetadata,
      errorMessage: entry.errorMessage,
    });
  } catch (err) {
    console.error('[AuditLogger] Failed to write audit log:', err);
  }
}
