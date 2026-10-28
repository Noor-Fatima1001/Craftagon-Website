function stripOperators(value) {
  if (Array.isArray(value)) return value.map(stripOperators);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith("$") || k.includes(".")) continue;
      out[k] = stripOperators(v);
    }
    return out;
  }
  return value;
}

function sanitize(req, _res, next) {
  if (req.body) req.body = stripOperators(req.body);
  if (req.params) req.params = stripOperators(req.params);
  next();
}

module.exports = sanitize;
