const jwt = require("jsonwebtoken");
const env = require("../config/env");
const Admin = require("../models/Admin");
const Customer = require("../models/Customer");
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

async function requireCustomer(req, _res, next) {
  try {
    const token = req.cookies?.customer_token;
    if (!token) throw new AppError("Please sign in", 401);
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.role !== "customer") throw new AppError("Please sign in", 401);
    const customer = await Customer.findById(payload.sub).select("-passwordHash");
    if (!customer) throw new AppError("Please sign in", 401);
    req.customer = customer;
    next();
  } catch (err) {
    next(
      err.name === "JsonWebTokenError" || err.name === "TokenExpiredError"
        ? new AppError("Please sign in", 401)
        : err
    );
  }
}

module.exports = { requireAdmin, requireCustomer, requireAjax, requireCronSecret };
