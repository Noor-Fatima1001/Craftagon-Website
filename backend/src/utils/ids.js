const crypto = require("crypto");
const Counter = require("../models/Counter");
const Order = require("../models/Order");

function lookupToken() {
  return crypto.randomBytes(24).toString("hex");
}

function randomFileName(ext) {
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
}

function normalizeOrderNumber(value) {
  const s = String(value || "").trim();
  if (/^\d+$/.test(s)) return s;
  return s.toUpperCase();
}

async function nextOrderNumber() {
  const existing = await Counter.findById("orderNumber");
  if (!existing) {
    const agg = await Order.aggregate([
      { $match: { orderNumber: { $regex: "^[0-9]+$" } } },
      { $project: { n: { $convert: { input: "$orderNumber", to: "long", onError: 0, onNull: 0 } } } },
      { $group: { _id: null, max: { $max: "$n" } } },
    ]);
    const seq = Number(agg[0]?.max || 0);
    try {
      await Counter.create({ _id: "orderNumber", seq });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
  const doc = await Counter.findOneAndUpdate(
    { _id: "orderNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return String(doc.seq);
}

module.exports = { nextOrderNumber, lookupToken, randomFileName, normalizeOrderNumber };
