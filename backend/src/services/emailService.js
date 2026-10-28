const nodemailer = require("nodemailer");
const env = require("../config/env");

function isConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

function status() {
  return {
    configured: isConfigured(),
    host: env.smtp.host || "",
    from: env.smtp.from,
  };
}

async function sendMail({ to, subject, html }) {
  if (!isConfigured()) {
    return { sent: false, reason: "SMTP is not configured" };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
    await transporter.sendMail({ from: env.smtp.from, to, subject, html });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

function wrap(title, body) {
  return `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
    <h2>${title}</h2>
    ${body}
    <p style="color:#666;font-size:13px">This is an automated message from Craftagon. WhatsApp messages are never sent automatically.</p>
  </div>`;
}

async function orderConfirmation(order, settings) {
  const items = order.items
    .map(
      (i) =>
        `<li>${i.quantity} × ${i.name}${i.customText ? ` (text: ${i.customText})` : ""} — PKR ${i.lineTotal}</li>`
    )
    .join("");
  return sendMail({
    to: order.customer.email,
    subject: `Order ${order.orderNumber} received`,
    html: wrap(
      "Thank you for your order",
      `<p>Order number: <strong>${order.orderNumber}</strong></p>
       <ul>${items}</ul>
       <p>Subtotal: PKR ${order.subtotal}<br/>Delivery: PKR ${order.deliveryFee}<br/>Discount: PKR ${order.discount}<br/>Total: PKR ${order.total}</p>
       <p>Advance due now: <strong>PKR ${order.advanceAmount}</strong><br/>Remaining COD: PKR ${order.remainingCod}</p>
       <p>Please transfer the advance using the payment details on your order page, then upload a screenshot. Staff will verify it manually.</p>
       <p>Store WhatsApp (you must press Send yourself): ${settings.whatsappNumber}</p>`
    ),
  });
}

async function paymentResult(order, verified, note) {
  return sendMail({
    to: order.customer.email,
    subject: verified
      ? `Payment verified for ${order.orderNumber}`
      : `Payment could not be verified for ${order.orderNumber}`,
    html: wrap(
      verified ? "Advance payment verified" : "Payment not verified",
      `<p>Order <strong>${order.orderNumber}</strong></p>
       <p>${verified ? "We have verified your advance payment. Your order will be prepared." : "We could not verify this payment. Please check the details and submit again if needed."}</p>
       ${note ? `<p>Note: ${note}</p>` : ""}`
    ),
  });
}

async function orderCancelled(order) {
  return sendMail({
    to: order.customer.email,
    subject: `Order ${order.orderNumber} cancelled`,
    html: wrap(
      "Order cancelled",
      `<p>Order <strong>${order.orderNumber}</strong> was cancelled.</p>
       <p>Reason: ${order.cancelReason || "Not specified"}</p>`
    ),
  });
}

async function orderDispatched(order) {
  return sendMail({
    to: order.customer.email,
    subject: `Order ${order.orderNumber} dispatched`,
    html: wrap(
      "Your order is on the way",
      `<p>Order <strong>${order.orderNumber}</strong> has been dispatched.</p>
       <p>Courier: ${order.courierName || "—"}<br/>Tracking: ${order.trackingNumber || "—"}</p>`
    ),
  });
}

module.exports = {
  isConfigured,
  status,
  sendMail,
  orderConfirmation,
  paymentResult,
  orderCancelled,
  orderDispatched,
};
