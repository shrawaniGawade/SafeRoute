import mongoose, { Document, Model, Schema } from 'mongoose';
import { memorySafetyPrediction } from './memoryStore';

export interface ISafetyPredictionFactors {
  lighting: number;
  crime_risk: number;
  accident_risk: number;
  crowd_level: number;
}

export interface ISafetyPredictionDetails {
  classification: string; // 'Safe' | 'Moderate Caution' | 'High Caution'
  recommendation: string;
  factor_breakdown?: Record<string, number | string>;
}

export interface IModelInfo {
  model_name: string;
  version: string;
  data_source: string;
  is_fallback?: boolean;
}

export interface ISafetyPrediction extends Document {
  _id: any;
  user?: mongoose.Types.ObjectId | null;
  clientRequestId?: string; // Idempotency key for preventing duplicate entries on client retries
  origin?: string;
  destination?: string;
  departureTime?: string;
  travelMode?: 'walking' | 'driving' | 'transit';
  factors: ISafetyPredictionFactors;
  safety_score: number;
  prediction_details: ISafetyPredictionDetails;
  model_info: IModelInfo;
  createdAt: Date;
  updatedAt: Date;
}

const SafetyPredictionSchema = new Schema<ISafetyPrediction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    clientRequestId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    origin: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    destination: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    departureTime: {
      type: String,
      trim: true,
      default: 'Immediate',
    },
    travelMode: {
      type: String,
      enum: ['walking', 'driving', 'transit'],
      default: 'walking',
    },
    factors: {
      lighting: {
        type: Number,
        required: [true, 'Lighting factor is required'],
        min: [0, 'Lighting factor must be between 0 and 10'],
        max: [10, 'Lighting factor must be between 0 and 10'],
      },
      crime_risk: {
        type: Number,
        required: [true, 'Crime risk factor is required'],
        min: [0, 'Crime risk factor must be between 0 and 10'],
        max: [10, 'Crime risk factor must be between 0 and 10'],
      },
      accident_risk: {
        type: Number,
        required: [true, 'Accident risk factor is required'],
        min: [0, 'Accident risk factor must be between 0 and 10'],
        max: [10, 'Accident risk factor must be between 0 and 10'],
      },
      crowd_level: {
        type: Number,
        required: [true, 'Crowd level factor is required'],
        min: [0, 'Crowd level factor must be between 0 and 10'],
        max: [10, 'Crowd level factor must be between 0 and 10'],
      },
    },
    safety_score: {
      type: Number,
      required: [true, 'Safety score is required'],
      min: [0, 'Safety score cannot be less than 0'],
      max: [100, 'Safety score cannot exceed 100'],
      index: true,
    },
    prediction_details: {
      classification: {
        type: String,
        required: true,
        default: 'Safe',
      },
      recommendation: {
        type: String,
        required: true,
      },
      factor_breakdown: {
        type: Schema.Types.Mixed,
      },
    },
    model_info: {
      model_name: {
        type: String,
        required: true,
        default: 'SafeRoute RandomForestClassifier',
      },
      version: {
        type: String,
        required: true,
        default: 'v1.0.0',
      },
      data_source: {
        type: String,
        required: true,
        default: 'SafeRoute Municipal Open Crime & Infrastructure Registry',
      },
      is_fallback: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user query history and recency
SafetyPredictionSchema.index({ user: 1, createdAt: -1 });
SafetyPredictionSchema.index({ createdAt: -1 });

export const MongoSafetyPrediction: Model<ISafetyPrediction> =
  (mongoose.models.SafetyPrediction as Model<ISafetyPrediction>) ||
  mongoose.model<ISafetyPrediction>('SafetyPrediction', SafetyPredictionSchema);

export const SafetyPrediction: any = new Proxy(MongoSafetyPrediction, {
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop in memorySafetyPrediction) {
      return (memorySafetyPrediction as any)[prop];
    }
    return Reflect.get(target, prop, receiver);
  },
});
