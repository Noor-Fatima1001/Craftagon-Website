const PaymentSubmission = require('../models/PaymentSubmission');
const Order = require('../models/Order');
const { sendPaymentResult } = require('../utils/mailer');
const { audit } = require('../utils/audit');
const { stripHtml } = require('../utils/escape');

async function submitPayment({ order, method, transactionRef, screenshotPath, amountClaimed }) {
  if (order.status === 'cancelled') {
    const err = new Error('This order is cancelled');
    err.status = 400;
    throw err;
  }
  if (order.paymentStatus === 'verified') {
    const err = new Error('Advance payment is already verified');
    err.status = 400;
    throw err;      const d = mode === "login" ? await api.login(form) : await api.register(form);
    
  }
  const submission = await PaymentSubmission.create({
    order: order._id,
    method: stripHtml(method || ''),
    transactionRef: stripHtml(transactionRef),
    screenshotPath,
    amountClaimed: Number(amountClaimed) || order.pricing.advanceAmount,
    status: 'under_review',
  });
  order.paymentStatus = 'under_review';
  order.status = 'payment_submitted';
  order.history.push({ message: `Payment proof submitted (${submission.transactionRef})`, by: 'customer' });
  await order.save();
  return submission;
}

async function reviewPayment({ submissionId, admin, approve, notes }) {
  const submission = await PaymentSubmission.findById(submissionId);
  if (!submission) {
    const err = new Error('Payment not found');
    err.status = 404;
    throw err;
  }
  const order = await Order.findById(submission.order);
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }
  if (submission.status === 'verified' || submission.status === 'rejected') {
    const err = new Error('This payment was already reviewed');
    err.status = 400;
    throw err;
  }
  submission.status = approve ? 'verified' : 'rejected';
  submission.adminNotes = stripHtml(notes || '');
  submission.reviewedAt = new Date();
  submission.reviewedBy = admin._id;
  await submission.save();

  if (approve) {
    await PaymentSubmission.updateMany(
      { order: order._id, _id: { $ne: submission._id }, status: 'under_review' },
      { status: 'rejected', adminNotes: 'Superseded by verified payment', reviewedAt: new Date(), reviewedBy: admin._id }
    );
    order.paymentStatus = 'verified';
    order.status = 'confirmed';
    order.history.push({ message: 'Advance payment verified', by: admin.email });
  } else {
    const other = await PaymentSubmission.exists({
      order: order._id,
      _id: { $ne: submission._id },
      status: 'under_review',
    });
    if (!other) {
      order.paymentStatus = 'rejected';
      order.status = 'pending_payment';
    }
    order.history.push({ message: `Payment rejected: ${submission.adminNotes || 'no note'}`, by: admin.email });
  }
  const mail = await sendPaymentResult(order, approve, submission.adminNotes);
  if (mail.sent) {
    if (approve) order.emailsSent.verified = true;
    else order.emailsSent.rejected = true;
  }
  await order.save();
  await audit(admin, approve ? 'payment_verified' : 'payment_rejected', 'PaymentSubmission', submission._id, notes);
  return { submission, order, email: mail };
}

module.exports = { submitPayment, reviewPayment };
