const AppError = require("../utils/AppError");
const Coupon = require("../models/Coupon");

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

function previewSnapshot(product) {
  const p = product.preview || {};
  return {
    enabled: p.enabled !== false,
    x: p.x ?? 50,
    y: p.y ?? 55,
    fontSize: p.fontSize ?? 22,
    fontFamily: p.fontFamily || "Georgia, serif",
    color: p.color || "#1f2937",
    align: p.align || "center",
    maxWidth: p.maxWidth ?? 70,
    rotation: p.rotation ?? 0,
  };
}

async function applyCoupon(code, subtotal) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return { discount: 0, couponCode: "" };

  const coupon = await Coupon.findOne({ code: normalized, active: true });
  if (!coupon) throw new AppError("Invalid discount code", 400);
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) {
    throw new AppError("This discount code has expired", 400);
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("This discount code has reached its usage limit", 400);
  }
  if (subtotal < (coupon.minOrder || 0)) {
    throw new AppError(`Minimum order of PKR ${coupon.minOrder} is required for this code`, 400);
  }

  const type = coupon.type === "percentage" ? "percent" : coupon.type;
  let discount = type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.round(Math.min(discount, subtotal));

  return {
    discount,
    couponCode: coupon.code,
    couponSnapshot: {
      code: coupon.code,
      type,
      value: coupon.value,
      minOrder: coupon.minOrder || 0,
      maxDiscount: coupon.maxDiscount || null,
      usageLimit: coupon.usageLimit || null,
      expiresAt: coupon.expiresAt || null,
    },
  };
}

async function quote({ productsById, cartItems, settings, city, province, couponCode, paymentOption }) {
  const lines = [];
  for (const item of cartItems) {
    const product = productsById.get(String(item.productId));
    if (!product || !product.active) throw new AppError("One or more products are unavailable", 400);
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) throw new AppError("Invalid quantity", 400);
    const customText = String(item.customText || "").trim();
    const customFont = String(item.customFont || "").trim();
    const customNote = String(item.customNote || "").trim().slice(0, 300);
    if (customFont.length > 60) throw new AppError("Font name must be at most 60 characters", 400);
    const cz = product.customization || {};
    if (cz.enabled !== false && cz.required !== false && !customText) {
      throw new AppError(`Name or Short Message is required for ${product.name}`, 400);
    }
    const max = cz.maxLength || 24;
    if (customText.length > max) {
      throw new AppError(`Name or Short Message for ${product.name} must be at most ${max} characters`, 400);
    }
    const colorVariantId = String(item.colorVariantId || "").trim();
    const colorVariant = (product.colorVariants || []).find(
      (variant) => String(variant._id) === colorVariantId
    );
    if ((product.colorVariants || []).length && !colorVariant) {
      throw new AppError(`Please select a valid color for ${product.name}`, 400);
    }
    if (colorVariantId && !colorVariant) {
      throw new AppError(`The selected color for ${product.name} is unavailable`, 400);
    }
    const price = unitPrice(product);
    const lineTotal = price * qty;
    lines.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: colorVariant?.image || product.images?.[0] || "",
      quantity: qty,
      unitPrice: price,
      customText,
      customFont,
      customNote,
      notes: String(product.notes || "").trim(),
      ...(colorVariant
        ? {
            color: {
              variantId: String(colorVariant._id),
              name: colorVariant.name,
              value: colorVariant.value,
            },
          }
        : {}),
      preview: previewSnapshot(product),
      lineTotal,
    });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const {
    discount,
    couponCode: appliedCoupon,
    couponSnapshot,
  } = await applyCoupon(couponCode, subtotal);
  const fee = deliveryFee(settings, city, province);
  const total = Math.max(0, subtotal - discount) + fee;
  const advance =
    paymentOption === "bank_transfer"
      ? total
      : advanceAmount(settings, { items: lines, total });
  const remainingCod = Math.max(0, total - advance);
  return {
    items: lines,
    subtotal,
    deliveryFee: fee,
    discount,
    couponCode: appliedCoupon,
    couponSnapshot,
    total,
    advanceAmount: advance,
    remainingCod,
  };
}

module.exports = { unitPrice, deliveryFee, quote };
