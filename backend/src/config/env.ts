import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saferoute',

  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'saferoute_dev_access_secret_key_change_in_production_min32chars',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'saferoute_dev_refresh_secret_key_change_in_production_min32chars',
    ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  SMTP: {
    HOST: process.env.SMTP_HOST || '',
    PORT: Number(process.env.SMTP_PORT) || 587,
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.SMTP_FROM || 'SafeRoute Security <no-reply@saferoute.com>',
  },

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};
