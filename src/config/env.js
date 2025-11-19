import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,

  nodeEnv: process.env.NODE_ENV || "development",
  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },

  cookieSecret: process.env.COOKIE_SECRET,

  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
    supportEmail: process.env.SUPPORT_EMAIL,
    supportPhone: process.env.SUPPORT_PHONE,
  },

  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:5173",
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: process.env.STRIPE_CURRENCY || "usd",
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};
