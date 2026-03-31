import dotenv from 'dotenv';

// Loads server/.env when running `node --watch src/index.js` from the `server/` directory.
dotenv.config();

export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3001,
  NODE_ENV: process.env.NODE_ENV ?? 'development',

  MYSQL_HOST: process.env.MYSQL_HOST,
  MYSQL_PORT: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  MYSQL_USER: process.env.MYSQL_USER,
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
  MYSQL_DATABASE: process.env.MYSQL_DATABASE,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret_change_me',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',

  REFRESH_TOKEN_COOKIE_NAME: process.env.REFRESH_TOKEN_COOKIE_NAME ?? 'refresh_token',
  REFRESH_TOKEN_EXPIRES_IN_DAYS: process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS
    ? Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS)
    : 14,
  REFRESH_COOKIE_SECURE: process.env.REFRESH_COOKIE_SECURE ? process.env.REFRESH_COOKIE_SECURE === 'true' : false,
  REFRESH_COOKIE_SAMESITE: process.env.REFRESH_COOKIE_SAMESITE ?? 'strict',

  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  EMAIL_FROM: process.env.EMAIL_FROM ?? '',
  ENQUIRY_STAFF_EMAILS: process.env.ENQUIRY_STAFF_EMAILS ?? '',
  SITE_URL: process.env.SITE_URL ?? 'http://localhost:5173',
};

export function hasMysqlConfig() {
  return Boolean(env.MYSQL_HOST && env.MYSQL_USER && env.MYSQL_PASSWORD && env.MYSQL_DATABASE);
}

