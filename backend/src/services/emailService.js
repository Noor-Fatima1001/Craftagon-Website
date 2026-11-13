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
    `<h3>Order Details</h3>
     <p>
       <strong>Placed:</strong> ${value(order.createdAt ? new Date(order.createdAt).toLocaleString() : "")}<br/>
       <strong>Status:</strong> ${value(order.status)} <strong>
     </p>
     
     <h3>Customer</h3>
     <p>
       <strong>Name:</strong> ${value(customer.fullName)}<br/>
       <strong>Phone:</strong> ${value(customer.phone)}<br/>
       <strong>Address:</strong> ${value(customer.address)}, ${value(customer.city)} (${value(customer.province)})
     </p>
     
     <h3>Items</h3>
     <table style="border-collapse:collapse;width:100%;text-align:left">
       <thead>
         <tr style="border-bottom:1px solid #ddd">
           <th style="padding:8px">Product</th>
           <th style="padding:8px">Qty</th>
           <th style="padding:8px">Total</th>
         </tr>
       </thead>
       <tbody>${rows}</tbody>
     </table>
     
     <h3>Totals</h3>
     <p>
       Subtotal: PKR ${escapeHtml(order.subtotal)}<br/>
       Delivery: PKR ${escapeHtml(order.deliveryFee)}<br/>
       <strong>Total: PKR ${escapeHtml(order.total)}</strong><br/>
       Advance Due: PKR ${escapeHtml(order.advanceAmount)}<br/>
       Remaining COD: PKR ${escapeHtml(order.remainingCod)}
     </p>`
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
      `<p>Hi ${order.customer.fullName || "there"},</p>
       <p>This is an update regarding your order <strong>${order.orderNumber}</strong>.</p>
       <p>${
         verified
           ? "Good news! We have successfully verified your advance payment. Your order is now confirmed and our team will start preparing it shortly. We will notify you again once it is dispatched."
           : "Unfortunately, we could not verify the payment you submitted. This can happen if the transaction reference or screenshot is unclear, or if the amount received does not match the advance amount. Please check your payment details and submit them again so we can proceed with your order."
       }</p>
       ${note ? `<p><strong>Note from our team:</strong> ${note}</p>` : ""}
       <p>If you have any questions, feel free to reply to this email or contact us on WhatsApp.</p>
       <p>Thank you for shopping with us.</p>`
    ),
  });
}

async function orderCancelled(order) {
  return sendMail({
    to: order.customer.email,
    subject: `Order ${order.orderNumber} cancelled`,
    html: wrap(
      "Order cancelled",
      `<p>Hi ${order.customer.fullName || "there"},</p>
       <p>We are writing to let you know that your order <strong>${order.orderNumber}</strong> has been cancelled.</p>
       <p><strong>Reason:</strong> ${order.cancelReason || "Not specified"}</p>
       <p>If you already made an advance payment or you think this cancellation is a mistake, please contact us and we will be happy to help you.</p>
       <p>You are always welcome to place a new order anytime. We hope to serve you again soon.</p>`
    ),
  });
}

async function orderDispatched(order) {
  return sendMail({
    to: order.customer.email,
    subject: `Order ${order.orderNumber} dispatched`,
    html: wrap(
      "Your order is on the way",
      `<p>Hi ${order.customer.fullName || "there"},</p>
       <p>Great news! Your order <strong>${order.orderNumber}</strong> has been dispatched and is on its way to you.</p>
       <p><strong>Courier:</strong> ${order.courierName || "—"}<br/>
       <strong>Tracking number:</strong> ${order.trackingNumber || "—"}</p>
       <p>You can use the tracking number above to follow your parcel with the courier. Delivery usually takes a few working days, depending on your city.</p>
       <p>Please keep your phone available so the courier can reach you. If there is any remaining balance (COD), kindly keep it ready at the time of delivery.</p>
       <p>Thank you for your order!</p>`
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
