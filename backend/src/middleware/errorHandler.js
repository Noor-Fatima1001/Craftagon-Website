const env = require("../config/env");

function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const payload = {
    error: status === 500 && env.isProd ? "Something went wrong" : err.message || "Error",
  };
  if (err.extra) Object.assign(payload, err.extra);
  if (!env.isProd && status === 500) payload.detail = err.stack;
  res.status(status).json(payload);
}

module.exports = errorHandler;
