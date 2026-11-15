const Order = require("../models/Order");
const emailService = require("./emailService");

const notifications = {
  delivered: {
    statusField: "deliveredEmailStatus",
    sentAtField: "deliveredEmailSentAt",
    errorField: "deliveredEmailError",
    send: emailService.orderDelivered,
    eligibleStatuses: ["delivered", "completed"],
  },
  completed: {
    statusField: "completedEmailStatus",
    sentAtField: "completedEmailSentAt",
    errorField: "completedEmailError",
    send: emailService.orderCompleted,
    eligibleStatuses: ["completed"],
  },
};

async function sendOrderStatusNotification(orderId, status) {
  const notification = notifications[status];
  if (!notification) throw new Error(`Unsupported order notification status: ${status}`);

  const claimed = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: { $in: notification.eligibleStatuses },
      $or: [
        { [notification.statusField]: { $in: ["pending", "failed"] } },
        { [notification.statusField]: { $exists: false } },
      ],
    },
    {
      $set: { [notification.statusField]: "sending", [notification.errorField]: "" },
    },
    { new: true }
  );
  if (!claimed) return { sent: false, skipped: true };

  const result = await notification.send(claimed);
  if (result.sent) {
    await Order.updateOne(
      { _id: orderId, [notification.statusField]: "sending" },
      {
        $set: {
          [notification.statusField]: "sent",
          [notification.sentAtField]: new Date(),
          [notification.errorField]: "",
        },
      }
    );
    return { sent: true };
  }

  await Order.updateOne(
    { _id: orderId, [notification.statusField]: "sending" },
    {
      $set: {
        [notification.statusField]: "failed",
        [notification.errorField]: result.reason || "Email could not be sent",
      },
    }
  );
  console.error(`${status} email failed for order ${orderId}: ${result.reason || "unknown error"}`);
  return { sent: false, reason: result.reason || "Email could not be sent" };
}

async function retryFailedOrderStatusNotifications() {
  const orders = await Order.find({
    $or: [
      { deliveredEmailStatus: "failed" },
      { completedEmailStatus: "failed" },
      { status: "delivered", deliveredEmailStatus: { $exists: false } },
      { status: "completed", completedEmailStatus: { $exists: false } },
    ],
  })
    .sort({ updatedAt: 1 })
    .limit(100)
    .select("_id status deliveredEmailStatus completedEmailStatus")
    .lean();

  let sent = 0;
  for (const order of orders) {
    if (order.deliveredEmailStatus === "failed" || (order.status === "delivered" && !order.deliveredEmailStatus)) {
      const result = await sendOrderStatusNotification(order._id, "delivered");
      if (result.sent) sent += 1;
    }
    if (order.completedEmailStatus === "failed" || (order.status === "completed" && !order.completedEmailStatus)) {
      const result = await sendOrderStatusNotification(order._id, "completed");
      if (result.sent) sent += 1;
    }
  }
  return { sent, attempted: orders.length };
}

module.exports = { sendOrderStatusNotification, retryFailedOrderStatusNotifications };
