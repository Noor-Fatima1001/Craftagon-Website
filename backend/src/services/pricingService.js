const Coupon = require("../models/Coupon");
const AppError = require("../utils/AppError");

function unitPrice(product) {
  if (product.salePrice != null && product.salePrice > 0 && product.salePrice < product.price) {
    return product.salePrice;
  }
  return product.price;
}

function deliveryFee(settings, city, province) {
  const rates = settings.delivery?.cityRates || [];
  const hit = rates.find(
    (r) =>
      r.city &&
      r.city.trim().toLowerCase() === String(city || "").trim().toLowerCase() &&
      (!r.province || r.province.trim().toLowerCase() === String(province || "").trim().toLowerCase())
  );
  if (hit) return Number(hit.fee) || 0;
  return Number(settings.delivery?.nationwideFlat) || 0;
}

function applyCouponDiscount(subtotal, coupon) {
  if (!coupon) return 0;
  let discount = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  return Math.max(0, Math.min(discount, subtotal));
}

function advanceAmount(settings, { items, total }) {
  const rules = settings.advance?.productRules || [];
  let special = 0;
  let remainingTotal = total;
  for (const item of items) {
    const rule = rules.find((r) => String(r.product) === String(item.product));
    if (!rule) continue;
    const line = item.lineTotal;
    remainingTotal -= line;
    special += rule.type === "percent" ? (line * rule.amount) / 100 : rule.amount * item.quantity;
  }
  const base = settings.advance || { type: "percent", amount: 50, minAdvance: 0 };
  const rest =
    base.type === "percent" ? (Math.max(0, remainingTotal) * base.amount) / 100 : Number(base.amount) || 0;
  const amount = Math.round(special + rest);
  const min = Number(base.minAdvance) || 0;
  return Math.min(total, Math.max(amount, min, 0));
}

async function loadValidCoupon(code, subtotal) {
  if (!code) return null;
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase(), active: true });
  if (!coupon) throw new AppError("Invalid coupon code", 400);
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new AppError("Coupon has expired", 400);
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("Coupon usage limit reached", 400);
  }
  if (subtotal < (coupon.minOrder || 0)) {
    throw new AppError(`Coupon requires a minimum subtotal of PKR ${coupon.minOrder}`, 400);
  }
  return coupon;
}

async function quote({ productsById, cartItems, settings, city, province, couponCode }) {
  const lines = [];
  for (const item of cartItems) {
    const product = productsById.get(String(item.productId));
    if (!product || !product.active) throw new AppError("One or more products are unavailable", 400);
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) throw new AppError("Invalid quantity", 400);
    if (product.stock < qty) throw new AppError(`Insufficient stock for ${product.name}`, 400);
    const customText = String(item.customText || "").trim();
    const cz = product.customization || {};
    if (cz.enabled !== false && cz.required !== false && !customText) {
      throw new AppError(`Custom text is required for ${product.name}`, 400);
    }
    const max = cz.maxLength || 24;
    if (customText.length > max) {
      throw new AppError(`Custom text for ${product.name} must be at most ${max} characters`, 400);
    }
    const price = unitPrice(product);
    const lineTotal = price * qty;
    lines.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] || "",
      quantity: qty,
      unitPrice: price,
      customText,
      lineTotal,
    });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const coupon = await loadValidCoupon(couponCode, subtotal);
  const discount = applyCouponDiscount(subtotal, coupon);
  const fee = deliveryFee(settings, city, province);
  const total = Math.max(0, subtotal - discount) + fee;
  const advance = advanceAmount(settings, { items: lines, total });
  const remainingCod = Math.max(0, total - advance);
  return {
    items: lines,
    subtotal,
    deliveryFee: fee,
    discount,
    couponCode: coupon ? coupon.code : "",
    coupon,
    total,
    advanceAmount: advance,
    remainingCod,
  };
}

module.exports = { unitPrice, deliveryFee, quote, loadValidCoupon };
