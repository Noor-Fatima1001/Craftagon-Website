const nodemailer = require('nodemailer');
const StoreSettings = require('../models/StoreSettings');

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  if (!smtpConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendMail({ to, subject, html, text }) {
  if (!smtpConfigured()) {
    return { sent: false, reason: 'SMTP is not configured' };
  }
  const settings = await StoreSettings.findOne({ key: 'default' }).lean();
  if (settings && settings.emailEnabled === false) {
    return { sent: false, reason: 'Email notifications are disabled in settings' };
  }
  try {
    const transport = getTransport();
    await transport.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Craftagon'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

function wrap(title, body) {
  return `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111">
    <h2 style="color:#2563EB">${title}</h2>
    ${body}
    <p style="color:#666;font-size:13px">This is an automated message from Craftagon. WhatsApp messages are not sent automatically.</p>
  </div>`;
}

function orderItemsHtml(order) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td>${i.name}</td><td>${i.customizationText || '-'}</td><td>${i.quantity}</td><td>Rs ${i.lineTotal}</td></tr>`
    )
    .join('');
  return `<table width="100%" cellpadding="6" style="border-collapse:collapse">
    <tr style="background:#f3f4f6"><th align="left">Item</th><th align="left">Custom text</th><th>Qty</th><th>Total</th></tr>
    ${rows}
  </table>
  <p>Subtotal: Rs ${order.pricing.subtotal}<br/>
  Discount: Rs ${order.pricing.discount}<br/>
  Delivery: Rs ${order.pricing.deliveryFee}<br/>
  <strong>Total: Rs ${order.pricing.total}</strong><br/>
  Advance due: Rs ${order.pricing.advanceAmount}<br/>
  Remaining COD: Rs ${order.pricing.remainingCod}</p>`;
}

async function sendOrderConfirmation(order, settings) {
  const accounts = (settings.paymentAccounts || [])
    .filter((a) => a.active)
    .map((a) => `<li><strong>${a.method}</strong> — ${a.holderName} ${a.accountNumber}<br/>${a.instructions || ''}</li>`)
    .join('');
  return sendMail({
    to: order.customer.email,
    subject: `Order ${order.orderNumber} confirmed — pay advance Rs ${order.pricing.advanceAmount}`,
    html: wrap(
      `Thank you, ${order.customer.fullName}`,
      `<p>Your order <strong>${order.orderNumber}</strong> has been placed.</p>
      ${orderItemsHtml(order)}
      <p>Please transfer the advance amount of <strong>Rs ${order.pricing.advanceAmount}</strong> using one of these accounts, then submit your payment proof on the order page.</p>
      <ul>${accounts}</ul>
      <p>Payment deadline: ${order.paymentDeadlineAt ? new Date(order.paymentDeadlineAt).toLocaleString() : 'see order page'}.</p>`
    ),
  });
}

async function sendPaymentResult(order, verified, notes) {
  const subject = verified
    ? `Payment verified for order ${order.orderNumber}`
    : `Payment rejected for order ${order.orderNumber}`;
  return sendMail({
    to: order.customer.email,
    subject,
    html: wrap(
      subject,
      `<p>${verified ? 'We verified your advance payment. We will process your order next.' : 'We could not verify this payment. Please check the details and submit again if needed.'}</p>
      ${notes ? `<p>Note: ${notes}</p>` : ''}`
    ),
  });
}

async function sendCancellation(order) {
  return sendMail({
    to: order.customer.email,
    subject: `Order ${order.orderNumber} cancelled`,
    html: wrap(
      'Order cancelled',
      `<p>Order <strong>${order.orderNumber}</strong> was cancelled. Reason: ${order.cancellation?.reason || 'Payment deadline expired'}.</p>
      <p>Stock has been released. Place a new order if you still wish to purchase.</p>`
    ),
  });
}

async function sendDispatch(order) {
  return sendMail({
    to: order.customer.email,
    subject: `Order ${order.orderNumber} dispatched`,
    html: wrap(
      'Your order is on the way',
      `<p>Courier: ${order.tracking?.courier || '-'}<br/>Tracking: ${order.tracking?.trackingNumber || '-'}</p>`
    ),
  });
}

module.exports = {
  smtpConfigured,
  sendMail,
  sendOrderConfirmation,
  sendPaymentResult,
  sendCancellation,
  sendDispatch,
};
