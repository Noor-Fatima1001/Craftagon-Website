const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
port: Number(process.env.PORT || 3000),
  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/craftagon"),
  jwtSecret: required("JWT_SECRET", "dev-only-change-me"),
  cookieSecure: String(process.env.COOKIE_SECURE || "false") === "true",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  cronSecret: process.env.CRON_SECRET || "dev-cron-secret",
  enableInternalCron: String(process.env.ENABLE_INTERNAL_CRON || "true") === "true",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  adminName: process.env.ADMIN_NAME || "Store Admin",
  storeWhatsapp: process.env.STORE_WHATSAPP || "923000000000",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Craftagon <no-reply@example.com>",
  },
};

env.isProd = env.nodeEnv === "production";

module.exports = env;
