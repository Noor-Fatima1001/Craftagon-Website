const crypto = require("crypto");

function orderNumber() {
  return `CRA-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function lookupToken() {
  return crypto.randomBytes(24).toString("hex");
}

function randomFileName(ext) {
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
}

module.exports = { orderNumber, lookupToken, randomFileName };
