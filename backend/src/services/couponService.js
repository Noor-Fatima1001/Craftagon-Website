const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const AppError = require("../utils/AppError");

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

// UI mein usageLimit 0 ya blank ka matlab unlimited hai
function hasLimit(coupon) {
  return coupon.usageLimit > 0;
}

// lines = priced items. Har line mein productId (ya product) aur lineTotal hona chahiye
function eligibleSubtotal(coupon, lines, subtotal) {
  if (!coupon.applicableProducts?.length) return subtotal;
  const allowed = new Set(coupon.applicableProducts.map(String));
  return lines
    .filter((l) => allowed.has(String(l.productId || l.product)))
    .reduce((sum, l) => sum + (Number(l.lineTotal) || 0), 0);
}

function calcDiscount(coupon, base) {
  let discount = coupon.type === "percent" ? (base * coupon.value) / 100 : coupon.value;
  if (coupon.type === "percent" && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  return Math.max(0, Math.round(Math.min(discount, base)));
}

// Sirf check karta hai, usedCount increase nahi karta (quote ke liye)
async function validateCoupon(code, { subtotal, lines = [] }) {
  const coupon = await Coupon.findOne({ code: normalizeCode(code) });
  if (!coupon || !coupon.active) throw new AppError("Invalid coupon code", 400);
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new AppError("This coupon has expired", 400);
  }
  if (hasLimit(coupon) && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("This coupon has reached its usage limit", 400);
  }
  if (subtotal < (coupon.minOrder || 0)) {
    throw new AppError(`Minimum order of Rs ${coupon.minOrder} is required for this coupon`, 400);
  }
  const base = eligibleSubtotal(coupon, lines, subtotal);
  if (base <= 0) {
    throw new AppError("This coupon is not valid for the products in your cart", 400);
  }
  return { coupon, discount: calcDiscount(coupon, base) };
}

// Order create se pehle call karo. Atomic hai, race condition mein limit nahi tootegi
async function consumeCoupon(couponId) {
  const updated = await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      active: true,
      $or: [{ usageLimit: { $in: [null, 0] } }, { usageLimit: { $exists: false } }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  if (!updated) throw new AppError("This coupon has reached its usage limit", 400);
  return updated;
}

// Order save hone ke baad: history entry
async function recordUsage({ coupon, order, discount }) {
  return CouponUsage.create({
    coupon: coupon._id,
    couponCode: coupon.code,
    order: order._id,
    orderNumber: order.orderNumber,
    customerName: order.customer?.fullName,
    customerEmail: order.customer?.email,
    customerPhone: order.customer?.phone,
    discountAmount: discount,
    orderTotal: order.total,
  });
}

// Order cancel ya order create fail hone par: usage wapas + history "released"
async function releaseUsage(orderId) {
  const usage = await CouponUsage.findOneAndUpdate(
    { order: orderId, status: "used" },
    { status: "released", releasedAt: new Date() }
  );
  if (usage) {
    await Coupon.updateOne({ _id: usage.coupon, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  }
}

module.exports = {
  normalizeCode,
  calcDiscount,
  validateCoupon,
  consumeCoupon,
  recordUsage,
  releaseUsage,
};