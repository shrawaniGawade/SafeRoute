import mongoose, { Document, Model, Schema } from 'mongoose';
import { memorySafetyRecord } from './memoryStore';

export interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ISafetyRecord extends Document {
  _id: any;
  location: IGeoPoint;
  factor: 'crime' | 'accident' | 'lighting' | 'crowd' | string;
  value: number; // 0 - 100
  source: string;
  isSample: boolean;
  externalId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SafetyRecordSchema = new Schema<ISafetyRecord>(
  {
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: [true, 'Location type must be Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Coordinates [longitude, latitude] are required'],
        validate: {
          validator: function (coords: number[]) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              typeof coords[0] === 'number' &&
              typeof coords[1] === 'number' &&
              !isNaN(coords[0]) &&
              !isNaN(coords[1]) &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: 'Coordinates must be valid [longitude, latitude] where longitude is between -180 and 180, and latitude is between -90 and 90',
        },
      },
    },
    factor: {
      type: String,
      required: [true, 'Safety factor category is required (e.g., crime, accident, lighting)'],
      trim: true,
      index: true,
    },
    value: {
      type: Number,
      required: [true, 'Factor score value is required'],
      min: [0, 'Safety factor value must be at least 0'],
      max: [100, 'Safety factor value cannot exceed 100'],
      validate: {
        validator: function (val: number) {
          return typeof val === 'number' && !isNaN(val) && val >= 0 && val <= 100;
        },
        message: 'Factor value must be a number between 0 and 100',
      },
    },
    source: {
      type: String,
      required: [true, 'Data source is required'],
      trim: true,
    },
    isSample: {
      type: Boolean,
      default: false,
      index: true,
    },
    externalId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index on location for fast geospatial proximity queries and $geoNear
SafetyRecordSchema.index({ location: '2dsphere' });
SafetyRecordSchema.index({ factor: 1, isSample: 1 });
SafetyRecordSchema.index({ externalId: 1 }, { unique: true, sparse: true });

export const MongoSafetyRecord: Model<ISafetyRecord> =
  (mongoose.models.SafetyRecord as Model<ISafetyRecord>) ||
  mongoose.model<ISafetyRecord>('SafetyRecord', SafetyRecordSchema);

export const SafetyRecord: any = new Proxy(MongoSafetyRecord, {
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop in memorySafetyRecord) {
      return (memorySafetyRecord as any)[prop];
    }
    return Reflect.get(target, prop, receiver);
  },
});
