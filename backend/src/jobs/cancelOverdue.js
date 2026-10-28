require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { connectDb } = require('../config/db');
const Order = require('../models/Order');
const PaymentSubmission = require('../models/PaymentSubmission');
const { restock } = require('../services/orderService');
const { getSettings } = require('../services/settingsService');
const { sendCancellation } = require('../utils/mailer');

async function cancelOverdueOrders() {
  const settings = await getSettings();
  if (!settings.autoCancelEnabled) {
    return { cancelled: 0, skipped: 'auto-cancel disabled' };
  }
  const now = new Date();
  const candidates = await Order.find({
    status: { $in: ['pending_payment', 'payment_submitted'] },
    paymentStatus: { $in: ['pending', 'rejected'] },
    paymentDeadlineAt: { $lte: now },
  });

  let cancelled = 0;
  for (const order of candidates) {
    if (['cancelled', 'dispatched', 'delivered', 'confirmed', 'processing'].includes(order.status)) continue;
    if (order.paymentStatus === 'verified' || order.paymentStatus === 'under_review') continue;
    const pendingReview = await PaymentSubmission.exists({ order: order._id, status: 'under_review' });
    if (pendingReview) continue;
    if (order.cancellation?.at) continue;

    order.status = 'cancelled';
    order.cancellation = {
      reason: 'Advance payment deadline expired',
      at: now,
      by: 'system',
    };
    order.history.push({ message: 'Automatically cancelled after payment deadline', by: 'system' });
    await restock(order);
    if (!order.emailsSent.cancelled) {
      const mail = await sendCancellation(order);
      if (mail.sent) order.emailsSent.cancelled = true;
    }
    await order.save();
    cancelled += 1;
  }
  return { cancelled };
}

async function runStandalone() {
  await connectDb();
  const result = await cancelOverdueOrders();
  console.log('Cancel overdue result:', result);
  process.exit(0);
}

if (require.main === module) {
  runStandalone().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { cancelOverdueOrders };
