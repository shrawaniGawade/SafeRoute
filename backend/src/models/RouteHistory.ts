import mongoose, { Document, Model, Schema } from 'mongoose';
import { memoryRouteHistory } from './memoryStore';

export interface IRouteCoordinate {
  lat: number;
  lng: number;
  label?: string;
}

export interface ISelectedRouteData {
  routeName: string;
  travelMode: 'walking' | 'driving' | 'transit';
  distanceText?: string;
  durationText?: string;
  safetyScore: number;
  waypoints?: IRouteCoordinate[];
  polyline?: string;
  summary?: string;
}

export interface IRouteHistory extends Document {
  _id: any;
  user?: mongoose.Types.ObjectId | null;
  predictionId?: mongoose.Types.ObjectId | null;
  clientRequestId?: string; // Idempotency key
  origin: {
    name: string;
    coordinates?: { lat: number; lng: number };
  };
  destination: {
    name: string;
    coordinates?: { lat: number; lng: number };
  };
  selectedRoute: ISelectedRouteData;
  status: 'requested' | 'selected' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const RouteHistorySchema = new Schema<IRouteHistory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    predictionId: {
      type: Schema.Types.ObjectId,
      ref: 'SafetyPrediction',
      default: null,
    },
    clientRequestId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    origin: {
      name: {
        type: String,
        required: [true, 'Origin waypoint name is required'],
        trim: true,
      },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    destination: {
      name: {
        type: String,
        required: [true, 'Destination waypoint name is required'],
        trim: true,
      },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    selectedRoute: {
      type: {
        routeName: {
          type: String,
          required: [true, 'Route name is required'],
          trim: true,
        },
        travelMode: {
          type: String,
          enum: ['walking', 'driving', 'transit'],
          required: [true, 'Travel mode is required'],
        },
        distanceText: { type: String, trim: true },
        durationText: { type: String, trim: true },
        safetyScore: {
          type: Number,
          required: [true, 'Route safety score is required'],
          min: 0,
          max: 100,
        },
        waypoints: [
          {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
            label: { type: String },
          },
        ],
        polyline: { type: String },
        summary: { type: String },
      },
      required: [true, 'Actual route data must be provided to persist in route history'],
    },
    status: {
      type: String,
      enum: ['requested', 'selected', 'completed', 'cancelled'],
      default: 'selected',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast user queries, filtering, and recency
RouteHistorySchema.index({ user: 1, createdAt: -1 });
RouteHistorySchema.index({ 'origin.name': 1, 'destination.name': 1 });

export const MongoRouteHistory: Model<IRouteHistory> =
  (mongoose.models.RouteHistory as Model<IRouteHistory>) ||
  mongoose.model<IRouteHistory>('RouteHistory', RouteHistorySchema);

export const RouteHistory: any = new Proxy(MongoRouteHistory, {
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop in memoryRouteHistory) {
      return (memoryRouteHistory as any)[prop];
    }
    return Reflect.get(target, prop, receiver);
  },
});
