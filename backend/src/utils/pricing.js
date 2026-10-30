function roundMoney(n) {
  return Math.max(0, Math.round(Number(n) * 100) / 100);
}

function effectiveUnitPrice(product) {
  if (product.salePrice != null && product.salePrice > 0 && product.salePrice < product.price) {
    return product.salePrice;
  }
  return product.price;
}

function deliveryFeeFor(settings, city, province) {
  const rates = settings.delivery?.cityRates || [];
  const match = rates.find(
    (r) =>
      String(r.city).trim().toLowerCase() === String(city || "").trim().toLowerCase() &&
      (!r.province || String(r.province).trim().toLowerCase() === String(province || "").trim().toLowerCase())
  );
  if (match && match.fee != null) return roundMoney(match.fee);
  return roundMoney(settings.delivery?.nationwideFlat || settings.delivery?.nationwideFee || 0);
}

module.exports = { roundMoney, effectiveUnitPrice, deliveryFeeFor };
