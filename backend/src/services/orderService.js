const Order = require("../models/Order");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { nextOrderNumber, lookupToken } = require("../utils/ids");
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
    discount: extra.includeHistory ? order.discount || 0 : undefined,
    total: order.total,
    advanceAmount: order.advanceAmount,
    remainingCod: order.remainingCod,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentDeadlineAt: order.paymentDeadlineAt,
    cancelledAt: order.cancelledAt,
    cancelReason: order.cancelReason,
    courierName: order.courierName || "",
    trackingNumber: order.trackingNumber || "",
    dispatchedAt: order.dispatchedAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
    history: extra.includeHistory ? order.history : undefined,
  };
}

async function restoreStock() {
  return;
}

async function createOrder({ cartItems, customer, idempotencyKey }) {
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
  });

  let created;
  let lastErr;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const hours = settings.paymentDeadlineHours || 48;
      created = await Order.create({
        orderNumber: await nextOrderNumber(),
        lookupToken: lookupToken(),
        idempotencyKey: idempotencyKey || undefined,
        customer,
        items: priced.items,
        subtotal: priced.subtotal,
        deliveryFee: priced.deliveryFee,
        discount: 0,
        couponCode: "",
        total: priced.total,
        advanceAmount: priced.advanceAmount,
        remainingCod: priced.remainingCod,
        pricingSnapshot: {
          deliveryFee: priced.deliveryFee,
          advanceAmount: priced.advanceAmount,
          unitPrices: priced.items.map((i) => ({ name: i.name, unitPrice: i.unitPrice })),
        },
        paymentDeadlineAt: new Date(Date.now() + hours * 60 * 60 * 1000),
        history: [{ status: "pending_payment", note: "Order created" }],
      });
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      if (err.code === 11000 && (err.keyPattern?.orderNumber || err.keyValue?.orderNumber)) {
        continue;
      }
      throw err;
    }
  }
  if (!created) throw lastErr || new AppError("Could not create order number", 500);

  const mail = await emailService.orderConfirmation(created, settings);
  return { order: created, duplicate: false, email: mail };
}

module.exports = { createOrder, publicOrder, restoreStock };
