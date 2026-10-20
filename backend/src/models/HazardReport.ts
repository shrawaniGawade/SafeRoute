import mongoose, { Document, Model, Schema } from 'mongoose';
import { memoryHazardReport } from './memoryStore';

export type HazardType =
  | 'broken_streetlight'
  | 'dark_alley'
  | 'road_damage'
  | 'harassment_risk'
  | 'construction'
  | 'isolated_zone'
  | 'other';

export interface IHazardReport extends Document {
  _id: any;
  hazardType: HazardType;
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
}

const HazardReportSchema = new Schema<IHazardReport>(
  {
    hazardType: {
      type: String,
      required: [true, 'Hazard type is required'],
      enum: [
        'broken_streetlight',
        'dark_alley',
        'road_damage',
        'harassment_risk',
        'construction',
        'isolated_zone',
        'other',
      ],
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    reportedBy: {
      type: String,
      default: 'Community User',
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'expired'],
      default: 'active',
      index: true,
    },
    verificationCount: {
      type: Number,
      default: 1,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

HazardReportSchema.index({ location: '2dsphere' });

export const MongoHazardReport: Model<IHazardReport> =
  (mongoose.models.HazardReport as Model<IHazardReport>) ||
  mongoose.model<IHazardReport>('HazardReport', HazardReportSchema);

export const HazardReport: any = new Proxy(MongoHazardReport, {
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop in memoryHazardReport) {
      return (memoryHazardReport as any)[prop];
    }
    return Reflect.get(target, prop, receiver);
  },
});
