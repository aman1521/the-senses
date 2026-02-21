import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 4000),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret',
  CORS_ORIGIN: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean),
  PRIVACY_MODE: process.env.PRIVACY_MODE || 'aggregate' // 'aggregate' or 'detailed'
};
