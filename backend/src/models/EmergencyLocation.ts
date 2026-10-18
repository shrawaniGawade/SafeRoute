import mongoose, { Document, Model, Schema } from 'mongoose';
import { memoryEmergencyLocation } from './memoryStore';

export interface IEmergencyPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export type EmergencyType = 'hospital' | 'police' | 'fire_station' | 'emergency_care' | 'other';

export interface IEmergencyLocation extends Document {
  _id: any;
  name: string;
  type: EmergencyType;
  location: IEmergencyPoint;
  phone?: string;
  source: string;
  osmId?: string;
  address?: string;
  isSample?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyLocationSchema = new Schema<IEmergencyLocation>(
  {
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Emergency location type is required'],
      enum: {
        values: ['hospital', 'police', 'fire_station', 'emergency_care', 'other'],
        message: 'Type must be hospital, police, fire_station, emergency_care, or other',
      },
      index: true,
    },
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
          message: 'Coordinates must be valid [longitude, latitude]',
        },
      },
    },
    phone: {
      type: String,
      trim: true,
      default: undefined,
    },
    source: {
      type: String,
      required: [true, 'Source identifier is required'],
      default: 'openstreetmap',
      trim: true,
    },
    osmId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    isSample: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index on location for fast geospatial proximity queries and $geoNear
EmergencyLocationSchema.index({ location: '2dsphere' });
EmergencyLocationSchema.index({ type: 1, name: 1 });
EmergencyLocationSchema.index({ osmId: 1 }, { unique: true, sparse: true });

export const MongoEmergencyLocation: Model<IEmergencyLocation> =
  (mongoose.models.EmergencyLocation as Model<IEmergencyLocation>) ||
  mongoose.model<IEmergencyLocation>('EmergencyLocation', EmergencyLocationSchema);

export const EmergencyLocation: any = new Proxy(MongoEmergencyLocation, {
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop in memoryEmergencyLocation) {
      return (memoryEmergencyLocation as any)[prop];
    }
    return Reflect.get(target, prop, receiver);
  },
});
