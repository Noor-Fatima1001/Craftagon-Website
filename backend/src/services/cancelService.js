const Order = require("../models/Order");
const { restoreStock } = require("./orderService");
const emailService = require("./emailService");
const { getSettings } = require("./settingsService");
const AppError = require("../utils/AppError");

async function cancelOverdueOrders() {
  const settings = await getSettings();
  if (!settings.autoCancelEnabled) return { cancelled: 0, skipped: true };

  const now = new Date();
  const candidates = await Order.find({
    status: "pending_payment",
    paymentStatus: { $in: ["pending", "rejected"] },
    paymentDeadlineAt: { $lte: now },
    cancelledAt: { $exists: false },
  });

  let cancelled = 0;
  for (const order of candidates) {
    if (order.paymentStatus === "verified" || order.paymentStatus === "under_review") continue;
    const fresh = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: "pending_payment",
        paymentStatus: { $in: ["pending", "rejected"] },
        cancelledAt: { $exists: false },
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          autoCancelled: true,
          cancelReason: "Advance payment deadline expired",
        },
        $push: {
          history: { at: new Date(), status: "cancelled", note: "Automatic cancellation: payment deadline expired" },
        },
      },
      { new: true }
    );
    if (!fresh) continue;
    await restoreStock(fresh);
    cancelled += 1;
    if (!fresh.cancelEmailSentAt) {
      const mail = await emailService.orderCancelled(fresh);
      if (mail.sent) {
        await Order.updateOne({ _id: fresh._id }, { $set: { cancelEmailSentAt: new Date() } });
      }
    }
  }
  return { cancelled };
}

async function adminCancel(order, reason, admin) {
  if (["cancelled", "dispatched", "delivered"].includes(order.status)) {
    throw new AppError("This order cannot be cancelled", 400);
  }
  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancelReason = reason || "Cancelled by admin";
  order.history.push({
    status: "cancelled",
    note: `Cancelled by ${admin.email}: ${order.cancelReason}`,
  });
  await order.save();
  await restoreStock(order);
  if (!order.cancelEmailSentAt) {
    const mail = await emailService.orderCancelled(order);
    if (mail.sent) {
      order.cancelEmailSentAt = new Date();
      await order.save();
    }
  }
  return order;
}

module.exports = { cancelOverdueOrders, adminCancel };
