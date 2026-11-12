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
  </div>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
}

async function orderConfirmation(order, settings) {
  const items = order.items
    .map(
      (i) =>
        `<li>${i.quantity} × ${i.name}${i.customText ? ` (text: ${i.customText})` : ""}${i.color?.name ? ` (color: ${i.color.name})` : ""} — PKR ${i.lineTotal}</li>`
    )
    .join("");
  return sendMail({
    to: order.customer.email,
    subject: `Order ${order.orderNumber} received`,
    html: wrap(
      "Thank you for your order",
      `<p>Order number: <strong>${order.orderNumber}</strong></p>
       <ul>${items}</ul>
       <p>Subtotal: PKR ${order.subtotal}<br/>Delivery: PKR ${order.deliveryFee}<br/>Total: PKR ${order.total}</p>
       <p>Advance due now: <strong>PKR ${order.advanceAmount}</strong><br/>Remaining COD: PKR ${order.remainingCod}</p>
       <p>Please transfer the advance using the payment details on your order page, then upload a screenshot. Staff will verify it manually.</p>
       <p>Contact on WhatsApp for any query : ${settings.whatsappNumber}</p>`
    ),
  });
}

async function orderNotification(order, to) {
  const customer = order.customer || {};
  const rows = (order.items || [])
    .map(
      (item) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(item.name)}${item.customText ? `<br/>Personalization: ${escapeHtml(item.customText)}` : ""}${item.color?.name ? `<br/>Color: ${escapeHtml(item.color.name)}` : ""}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(item.quantity)}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd">PKR ${escapeHtml(item.unitPrice)}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd">PKR ${escapeHtml(item.lineTotal)}</td>
      </tr>`
    )
    .join("");
  const value = (item) => escapeHtml(item || "—");

  return sendMail({
    to,
    subject: `New order ${order.orderNumber} — Craftagon`,
    html: wrap(
      `New order ${escapeHtml(order.orderNumber)}`,
      `<h3>Order details</h3>
       <p>Placed: ${value(order.createdAt ? new Date(order.createdAt).toLocaleString() : "")}<br/>
       Status: ${value(order.status)}<br/>
       Payment status: ${value(order.paymentStatus)}<br/>
       Payment deadline: ${value(order.paymentDeadlineAt ? new Date(order.paymentDeadlineAt).toLocaleString() : "")}</p>
       <h3>Customer</h3>
       <p>Name: ${value(customer.fullName)}<br/>
       Email: ${value(customer.email)}<br/>
       Phone: ${value(customer.phone)}<br/>
       Address: ${value(customer.address)}<br/>
       City: ${value(customer.city)}<br/>
       Province: ${value(customer.province)}<br/>
       Landmark: ${value(customer.landmark)}<br/>
       Notes: ${value(customer.notes)}</p>
       <h3>Items</h3>
       <table style="border-collapse:collapse;width:100%;text-align:left">
         <thead><tr><th style="padding:8px">Product</th><th style="padding:8px">Qty</th><th style="padding:8px">Unit price</th><th style="padding:8px">Line total</th></tr></thead>
         <tbody>${rows}</tbody>
       </table>
       <h3>Totals</h3>
       <p>Subtotal: PKR ${escapeHtml(order.subtotal)}<br/>
       Discount: PKR ${escapeHtml(order.discount || 0)}<br/>
       Coupon: ${value(order.couponCode)}<br/>
       Delivery: PKR ${escapeHtml(order.deliveryFee)}<br/>
       <strong>Total: PKR ${escapeHtml(order.total)}</strong><br/>
       Advance due: PKR ${escapeHtml(order.advanceAmount)}<br/>
       Remaining COD: PKR ${escapeHtml(order.remainingCod)}</p>`
    ),
  });
}

async function testOrderNotification(to) {
  return sendMail({
    to,
    subject: "Craftagon order notification test",
    html: wrap("Order notification test", "<p>Your order notification email is configured correctly.</p>"),
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
  orderNotification,
  testOrderNotification,
  paymentResult,
  orderCancelled,
  orderDispatched,
};
