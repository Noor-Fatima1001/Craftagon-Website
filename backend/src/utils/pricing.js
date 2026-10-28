function roundMoney(n) {
  return Math.max(0, Math.round(Number(n) * 100) / 100);
}

function effectiveUnitPrice(product) {
  if (product.salePrice != null && product.salePrice > 0 && product.salePrice < product.price) {
    return product.salePrice;
  }
  return product.price;
}

function deliveryFeeFor(settings, city) {
  const rates = settings.delivery?.cityRates || [];
  const match = rates.find(
    (r) => String(r.city).trim().toLowerCase() === String(city || '').trim().toLowerCase()
  );
  if (match && match.fee != null) return roundMoney(match.fee);
  return roundMoney(settings.delivery?.nationwideFee || 0);
}

function couponDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (!coupon.active) return 0;
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return 0;
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return 0;
  if (subtotal < (coupon.minOrder || 0)) return 0;
  if (coupon.type === 'percent') return roundMoney((subtotal * coupon.value) / 100);
  return roundMoney(Math.min(coupon.value, subtotal));
}

function advanceForCart(settings, pricedItems, subtotalAfterDiscount) {
  const rules = settings.advance?.productRules || [];
  let productAdvance = 0;
  let usedRule = false;
  for (const item of pricedItems) {
    const rule = rules.find((r) => String(r.productId) === String(item.product._id || item.product));
    if (!rule) continue;
    usedRule = true;
    const line = item.lineTotal;
    productAdvance += rule.type === 'percent' ? (line * rule.amount) / 100 : rule.amount * item.quantity;
  }
  let amount;
  if (usedRule) {
    const remainingSub = pricedItems
      .filter((i) => !rules.find((r) => String(r.productId) === String(i.product._id || i.product)))
      .reduce((s, i) => s + i.lineTotal, 0);
    const cfg = settings.advance || { type: 'percent', amount: 50 };
    const rest =
      cfg.type === 'percent' ? (remainingSub * cfg.amount) / 100 : remainingSub > 0 ? cfg.amount : 0;
    amount = productAdvance + rest;
  } else {
    const cfg = settings.advance || { type: 'percent', amount: 50 };
    amount = cfg.type === 'percent' ? (subtotalAfterDiscount * cfg.amount) / 100 : cfg.amount;
  }
  amount = roundMoney(amount);
  const minAmount = roundMoney(settings.advance?.minAmount || 0);
  if (amount < minAmount) amount = minAmount;
  return amount;
}

function quoteTotals({ settings, pricedItems, coupon, city }) {
  const subtotal = roundMoney(pricedItems.reduce((s, i) => s + i.lineTotal, 0));
  const discount = couponDiscount(coupon, subtotal);
  const afterDiscount = roundMoney(subtotal - discount);
  const deliveryFee = deliveryFeeFor(settings, city);
  const total = roundMoney(afterDiscount + deliveryFee);
  let advanceAmount = advanceForCart(settings, pricedItems, afterDiscount);
  if (advanceAmount > total) advanceAmount = total;
  const remainingCod = roundMoney(total - advanceAmount);
  return {
    subtotal,
    discount,
    couponCode: coupon?.code || '',
    deliveryFee,
    total,
    advanceAmount,
    remainingCod,
  };
}

module.exports = { roundMoney, effectiveUnitPrice, deliveryFeeFor, couponDiscount, quoteTotals };
