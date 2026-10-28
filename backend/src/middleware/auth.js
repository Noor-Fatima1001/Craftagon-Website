const jwt = require("jsonwebtoken");
const env = require("../config/env");
const Admin = require("../models/Admin");
const AppError = require("../utils/AppError");

async function requireAdmin(req, _res, next) {
  try {
    const token = req.cookies?.admin_token;
    if (!token) throw new AppError("Authentication required", 401);
    const payload = jwt.verify(token, env.jwtSecret);
    const admin = await Admin.findById(payload.sub).select("-passwordHash");
    if (!admin) throw new AppError("Authentication required", 401);
    req.admin = admin;
    next();
  } catch (err) {
    next(err.name === "JsonWebTokenError" || err.name === "TokenExpiredError"
      ? new AppError("Authentication required", 401)
      : err);
  }
}

function requireAjax(_req, res, next) {
  const header = String(_req.get("X-Requested-With") || "");
  if (header !== "XMLHttpRequest" && env.isProd) {
    return res.status(403).json({ error: "Invalid request" });
  }
  next();
}

function requireCronSecret(req, _res, next) {
  const provided = req.get("X-Cron-Secret") || req.query.secret;
  if (!provided || provided !== env.cronSecret) {
    return next(new AppError("Forbidden", 403));
  }
  next();
}

module.exports = { requireAdmin, requireAjax, requireCronSecret };
