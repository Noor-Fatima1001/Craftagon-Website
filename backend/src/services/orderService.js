const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const AppError = require("../utils/AppError");
const { orderNumber, lookupToken } = require("../utils/ids");
const { quote } = require("./pricingService");
const { getSettings } = require("./settingsService");
const emailService = require("./emailService");

function publicOrder(order, extra = {}) {
  return {
    id: order._id,
    orderNumber: order.orderNumber,
    lookupToken: extra.includeToken ? order.lookupToken : undefined,
    customer: extra.includeCustomer
      ? order.customer
      : {
          fullName: order.customer.fullName,
          city: order.customer.city,
          province: order.customer.province,
        },
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    discount: order.discount,
    couponCode: order.couponCode,
    total: order.total,
    advanceAmount: order.advanceAmount,
    remainingCod: order.remainingCod,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentDeadlineAt: order.paymentDeadlineAt,
    cancelledAt: order.cancelledAt,
    cancelReason: order.cancelReason,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    history: extra.includeHistory ? order.history : undefined,
  };
}

async function restoreStock(order) {
  for (const line of order.items) {
    if (line.product) {
      await Product.updateOne({ _id: line.product }, { $inc: { stock: line.quantity } });
    }
  }
}

async function createOrder({ cartItems, customer, couponCode, idempotencyKey }) {
  if (idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey });
    if (existing) return { order: existing, duplicate: true };
  }

  const settings = await getSettings();
  const ids = [...new Set(cartItems.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: ids } });
  const productsById = new Map(products.map((p) => [String(p._id), p]));
  const priced = await quote({
    productsById,
    cartItems,
    settings,
    city: customer.city,
    province: customer.province,
    couponCode,
  });

  const decremented = [];
  try {
    for (const line of priced.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: line.product, stock: { $gte: line.quantity }, active: true },
        { $inc: { stock: -line.quantity } },
        { new: true }
      );
      if (!updated) throw new AppError(`Insufficient stock for ${line.name}`, 409);
      decremented.push(line);
    }
    if (priced.coupon) {
      const filter = { _id: priced.coupon._id };
      if (priced.coupon.usageLimit != null) filter.usedCount = { $lt: priced.coupon.usageLimit };
      const c = await Coupon.findOneAndUpdate(filter, { $inc: { usedCount: 1 } }, { new: true });
      if (!c) throw new AppError("Coupon could not be applied", 400);
    }
    const hours = settings.paymentDeadlineHours || 48;
    const created = await Order.create({
      orderNumber: orderNumber(),
      lookupToken: lookupToken(),
      idempotencyKey: idempotencyKey || undefined,
      customer,
      items: priced.items,
      subtotal: priced.subtotal,
      deliveryFee: priced.deliveryFee,
      discount: priced.discount,
      couponCode: priced.couponCode,
      total: priced.total,
      advanceAmount: priced.advanceAmount,
      remainingCod: priced.remainingCod,
      pricingSnapshot: {
        deliveryFee: priced.deliveryFee,
        advanceAmount: priced.advanceAmount,
        discount: priced.discount,
        unitPrices: priced.items.map((i) => ({ name: i.name, unitPrice: i.unitPrice })),
      },
      paymentDeadlineAt: new Date(Date.now() + hours * 60 * 60 * 1000),
      history: [{ status: "pending_payment", note: "Order created" }],
    });
    const mail = await emailService.orderConfirmation(created, settings);
    return { order: created, duplicate: false, email: mail };
  } catch (err) {
    for (const line of decremented) {
      await Product.updateOne({ _id: line.product }, { $inc: { stock: line.quantity } });
    }
    throw err;
  }
}

module.exports = { createOrder, publicOrder, restoreStock };
