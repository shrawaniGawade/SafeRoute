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
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  save(): Promise<InMemoryUserDoc>;
}

export interface InMemoryOtpDoc {
  _id: string;
  email: string;
  hashedOtp: string;
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  attempts: number;
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

const usersMap = new Map<string, InMemoryUserDoc>();
const otpsMap = new Map<string, InMemoryOtpDoc>();
const refreshTokensMap = new Map<string, InMemoryRefreshTokenDoc>();

export const memoryUser = {
  findOne(query: { email?: string }) {
    const findPromise = (async () => {
      if (!query?.email) return null;
      const targetEmail = query.email.toLowerCase().trim();
      for (const u of usersMap.values()) {
        if (u.email.toLowerCase().trim() === targetEmail) {
          return u;
        }
      }
      return null;
    })();

    return Object.assign(findPromise, {
      select: () => findPromise,
    });
  },

  find(query?: any) {
    const listPromise = (async () => {
      let results = Array.from(usersMap.values());
      if (query?.role) {
        results = results.filter((u) => u.role === query.role);
      }
      if (query?.isVerified !== undefined) {
        results = results.filter((u) => u.isVerified === query.isVerified);
      }
      return results;
    })();

    return Object.assign(listPromise, {
      select: () => listPromise,
      sort: () => listPromise,
    });
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
    return usersMap.get(id.toString()) || null;
  },

  async findByIdAndUpdate(id: string, update: any, options?: any): Promise<InMemoryUserDoc | null> {
    const user = usersMap.get(id.toString());
    if (!user) return null;
    if (update.$set) {
      Object.assign(user, update.$set);
    } else {
      Object.assign(user, update);
    }
    user.updatedAt = new Date();
    usersMap.set(id.toString(), user);
    return user;
  },

  async findByIdAndDelete(id: string): Promise<InMemoryUserDoc | null> {
    const user = usersMap.get(id.toString());
    if (!user) return null;
    usersMap.delete(id.toString());
    return user;
  },

  async create(data: { name: string; email: string; password?: string; isVerified?: boolean; role?: 'user' | 'admin' }): Promise<InMemoryUserDoc> {
    const id = generateHexId();
    let hashedPassword = data.password;
    if (data.password) {
      const salt = await bcrypt.genSalt(12);
      hashedPassword = await bcrypt.hash(data.password, salt);
    }

    const doc: InMemoryUserDoc = {
      _id: id,
      name: data.name,
      email: data.email.toLowerCase().trim(),
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
    };

    usersMap.set(id, doc);
    return doc;
  },
};

export const memoryOtp = {
  async findOne(query: { email?: string; purpose?: string }): Promise<InMemoryOtpDoc | null> {
    const email = query.email?.toLowerCase().trim();
    for (const o of otpsMap.values()) {
      if ((!email || o.email === email) && (!query.purpose || o.purpose === query.purpose)) {
        if (o.expiresAt > new Date()) {
          return o;
        }
      }
    }
    return null;
  },

  async create(data: { email: string; hashedOtp: string; purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'; expiresAt: Date }): Promise<InMemoryOtpDoc> {
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
  async create(data: { userId: any; tokenHash: string; family: string; isRevoked: boolean; expiresAt: Date }): Promise<InMemoryRefreshTokenDoc> {
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
