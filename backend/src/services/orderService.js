const Order = require("../models/Order");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { nextOrderNumber, lookupToken } = require("../utils/ids");
const { quote } = require("./pricingService");
const { getSettings } = require("./settingsService");
const emailService = require("./emailService");
const Coupon = require("../models/Coupon");

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
    completedAt: order.completedAt,
    createdAt: order.createdAt,
    discount: order.discount || 0,
    couponCode: order.couponCode || "",
    paymentMethod: order.paymentMethod || "cod",
    history: extra.includeHistory ? order.history : undefined,
  };
}

async function restoreStock() {
  return;
}

async function reserveCoupon(code) {
  const now = new Date();
  const coupon = await Coupon.findOneAndUpdate(
    {
      code,
      active: true,
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: now } },
          ],
        },
        {
          $or: [
            { usageLimit: { $exists: false } },
            { usageLimit: null },
            { usageLimit: 0 },
            { $expr: { $lt: [{ $ifNull: ["$usedCount", 0] }, "$usageLimit"] } },
          ],
        },
      ],
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  if (!coupon) throw new AppError("This discount code is no longer available", 400);
}

async function releaseCouponReservation(code) {
  const result = await Coupon.updateOne(
    { code, usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } }
  );
  if (!result.modifiedCount) {
    throw new AppError("Order creation failed and coupon usage could not be restored; contact support", 500);
  }
}

async function createOrder({
  cartItems,
  customer,
  idempotencyKey,
  couponCode,
  paymentMethod,
}) {
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
    paymentOption: paymentMethod,
  });

  let couponReserved = false;
  if (priced.couponCode) {
    await reserveCoupon(priced.couponCode);
    couponReserved = true;
  }

  let created;
  let lastErr;
  try {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const hours = settings.paymentDeadlineHours || 48;
        created = await Order.create({
          orderNumber: `CRFTGN-${await nextOrderNumber()}`,
          lookupToken: lookupToken(),
          idempotencyKey: idempotencyKey || undefined,
          customer,
          items: priced.items,
          subtotal: priced.subtotal,
          deliveryFee: priced.deliveryFee,
          discount: priced.discount,
          couponCode: priced.couponCode,
          paymentMethod:
            paymentMethod === "bank_transfer" ? "bank_transfer" : "cod",
          total: priced.total,
          advanceAmount: priced.advanceAmount,
          remainingCod: priced.remainingCod,
          pricingSnapshot: {
            deliveryFee: priced.deliveryFee,
            advanceAmount: priced.advanceAmount,
            unitPrices: priced.items.map((i) => ({
              name: i.name,
              unitPrice: i.unitPrice,
            })),
            coupon: priced.couponSnapshot,
          },
          paymentDeadlineAt: new Date(Date.now() + hours * 60 * 60 * 1000),
          history: [{ status: "pending_payment", note: "Order created" }],
        });
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        if (
          err.code === 11000 &&
          (err.keyPattern?.orderNumber || err.keyValue?.orderNumber)
        ) {
          continue;
        }
        throw err;
      }
    }
    if (!created) throw lastErr || new AppError("Could not create Order ID", 500);
  } catch (err) {
    if (couponReserved) await releaseCouponReservation(priced.couponCode);
    throw err;
  }

  const mail = await emailService.orderConfirmation(created, settings);
  if (settings.orderNotificationEmail) {
    const notification = await emailService.orderNotification(
      created,
      settings.orderNotificationEmail,
    );
    if (!notification.sent) {
      console.error(
        `Order notification email failed for ${created.orderNumber}: ${notification.reason}`,
      );
    }
  }
  return { order: created, duplicate: false, email: mail };
}

module.exports = { createOrder, publicOrder, restoreStock };
