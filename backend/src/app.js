const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const sanitize = require("./middleware/sanitize");
const errorHandler = require("./middleware/errorHandler");
const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");

const app = express();

app.set("trust proxy", 1);

// ---- CORS: multiple allowed origins ----
const defaultOrigins = [
  "https://www.craftagon.com",
  "https://craftagon.com",
  "https://craftagon-website.vercel.app",
  "http://localhost:5173",
];

const envOrigins = String(env.frontendUrl || "")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, "")) // trailing slash hata do
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin(origin, callback) {
    // Postman/curl/server-to-server requests mein origin nahi hota
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false); // error throw nahi, bas CORS headers nahi lagenge
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
};

// CORS sabse pehle (helmet se bhi pehle), taake preflight hamesha handle ho
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(sanitize);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS", // preflight ko rate limit na karo
  })
);

app.use("/uploads/products", express.static(path.join(__dirname, "../uploads/products")));
app.use("/uploads/banners", express.static(path.join(__dirname, "../uploads/banners")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);

module.exports = app;