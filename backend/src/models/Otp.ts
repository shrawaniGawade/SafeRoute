import mongoose, { Document, Model, Schema } from 'mongoose';
import { memoryOtp } from './memoryStore';

export type OtpPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export interface IOtp extends Document {
  _id: any;
  email: string;
  hashedOtp: string;
  purpose: OtpPurpose;
  attempts: number;
  verified?: boolean;
  verificationTokenHash?: string;
  verifiedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    hashedOtp: {
      type: String,
      required: false,
      default: '',
    },
    purpose: {
      type: String,
      enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationTokenHash: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const MongoOtp: Model<IOtp> = mongoose.model<IOtp>('Otp', OtpSchema);

export const Otp: any = new Proxy(MongoOtp, {
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop in memoryOtp) {
      return (memoryOtp as any)[prop];
    }
    return Reflect.get(target, prop, receiver);
  },
});
