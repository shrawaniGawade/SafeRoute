import mongoose, { Document, Model, Schema } from 'mongoose';
import { memoryCustomPlace } from './memoryStore';

export type PlaceCategory =
  | 'residential_society'
  | 'society_entrance'
  | 'building_entrance'
  | 'temple_religious'
  | 'hospital_clinic'
  | 'school_college'
  | 'shop_market'
  | 'office_business'
  | 'junction_lane'
  | 'other';

export type PinType = 'exact_entrance' | 'complex_gate' | 'general_place';

export type VerificationStatus = 'verified' | 'community_submitted' | 'under_review' | 'flagged';

export interface ICustomPlace extends Document {
  _id: any;
  name: string;
  aliases: string[];
  category: PlaceCategory;
  pinType: PinType;
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
  source: 'community' | 'user_manual_pin' | 'verified_partner';
  verificationStatus: VerificationStatus;
  reportCount: number;
  reportReasons: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomPlaceSchema = new Schema<ICustomPlace>(
  {
    name: {
      type: String,
      required: [true, 'Place name is required'],
      trim: true,
      index: true,
    },
    aliases: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'residential_society',
          'society_entrance',
          'building_entrance',
          'temple_religious',
          'hospital_clinic',
          'school_college',
          'shop_market',
          'office_business',
          'junction_lane',
          'other',
        ],
        message: 'Invalid place category',
      },
      index: true,
      default: 'residential_society',
    },
    pinType: {
      type: String,
      enum: ['exact_entrance', 'complex_gate', 'general_place'],
      default: 'general_place',
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
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      trim: true,
    },
    locality: {
      type: String,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: 'Maharashtra',
    },
    postcode: {
      type: String,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    creatorName: {
      type: String,
      trim: true,
      default: 'Community User',
    },
    creatorId: {
      type: Schema.Types.Mixed,
      default: null,
    },
    source: {
      type: String,
      enum: ['community', 'user_manual_pin', 'verified_partner'],
      default: 'user_manual_pin',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['verified', 'community_submitted', 'under_review', 'flagged'],
      default: 'community_submitted',
      index: true,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    reportReasons: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for proximity searches
CustomPlaceSchema.index({ location: '2dsphere' });
CustomPlaceSchema.index({ name: 'text', aliases: 'text', locality: 'text', landmark: 'text' });

export const MongoCustomPlace: Model<ICustomPlace> =
  (mongoose.models.CustomPlace as Model<ICustomPlace>) ||
  mongoose.model<ICustomPlace>('CustomPlace', CustomPlaceSchema);

export const CustomPlace: any = new Proxy(MongoCustomPlace, {
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop in memoryCustomPlace) {
      return (memoryCustomPlace as any)[prop];
    }
    return Reflect.get(target, prop, receiver);
  },
});
