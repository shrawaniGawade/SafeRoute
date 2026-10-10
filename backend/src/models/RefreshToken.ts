import mongoose, { Document, Model, Schema } from 'mongoose';
import { memoryRefreshToken } from './memoryStore';

export interface IRefreshToken extends Document {
  _id: any;
  userId: any;
  tokenHash: string;
  family: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    family: {
      type: String,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
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

const MongoRefreshToken: Model<IRefreshToken> = mongoose.model<IRefreshToken>(
  'RefreshToken',
  RefreshTokenSchema
);

export const RefreshToken: any = new Proxy(MongoRefreshToken, {
  get(target, prop, receiver) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    if (prop in memoryRefreshToken) {
      return (memoryRefreshToken as any)[prop];
    }
    return Reflect.get(target, prop, receiver);
  },
});
