const nodemailer = require('nodemailer');
const StoreSettings = require('../models/StoreSettings');

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function getTransport() {
  if (!smtpConfigured()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}


function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[char];
  });
}

function formatDate(date) {
  if (!date) return 'Please check your order page';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Please check your order page';
  }

  return parsedDate.toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Karachi',
  });
}

function wrap(title, body) {
  return `
    <div style="
      font-family: Arial, Helvetica, sans-serif;
      max-width: 640px;
      margin: 0 auto;
      padding: 24px 16px;
      color: #1f2937;
      background-color: #ffffff;
      line-height: 1.7;
    ">
      <div style="
        text-align: center;
        padding: 20px;
        background-color: #eff6ff;
        border-radius: 12px;
        margin-bottom: 24px;
      ">
        <h1 style="
          color: #2563eb;
          margin: 0;
          font-size: 26px;
        ">Craftagon</h1>

        <p style="
          color: #64748b;
          margin: 6px 0 0;
          font-size: 13px;
        ">Thoughtfully made, just for you.</p>
      </div>

      <h2 style="
        color: #111827;
        font-size: 22px;
        margin-bottom: 16px;
      ">${title}</h2>

      ${body}

      <div style="
        margin-top: 32px;
        padding-top: 18px;
        border-top: 1px solid #e5e7eb;
        color: #6b7280;
        font-size: 12px;
        text-align: center;
      ">
        <p>Thank you for choosing Craftagon!</p>
      </div>
    </div>
  `;
}

function orderItemsHtml(order) {
  const rows = (order.items || [])
    .map((item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
          ${escapeHtml(item.name)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
          ${escapeHtml(item.customizationText || '—')}
        </td>
        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">
          ${escapeHtml(item.quantity)}
        </td>
        <td style="padding: 10px; text-align: right; white-space: nowrap; border-bottom: 1px solid #e5e7eb;">
          Rs ${escapeHtml(item.lineTotal)}
        </td>
      </tr>
    `)
    .join('');

  const pricing = order.pricing;

  return `
    <h3 style="margin-top: 28px; color: #111827;">
      Your Order Summary
    </h3>

    <table style="
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 24px;
    ">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th align="left" style="padding: 10px;">Item</th>
          <th align="left" style="padding: 10px;">Customization</th>
          <th style="padding: 10px;">Qty</th>
          <th align="right" style="padding: 10px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div style="
      background-color: #f9fafb;
      border-radius: 10px;
      padding: 18px;
    ">
      <p style="margin: 4px 0;">
        Subtotal:
        <span style="float: right;">Rs ${escapeHtml(pricing.subtotal)}</span>
      </p>

      <p style="margin: 4px 0;">
        Discount:
        <span style="float: right;">Rs ${escapeHtml(pricing.discount)}</span>
      </p>

      <p style="margin: 4px 0;">
        Delivery Fee:
        <span style="float: right;">Rs ${escapeHtml(pricing.deliveryFee)}</span>
      </p>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 14px 0;">

      <p style="font-size: 17px; margin: 8px 0; font-weight: bold;">
        Order Total:
        <span style="float: right; color: #2563eb;">
          Rs ${escapeHtml(pricing.total)}
        </span>
      </p>

      <p style="margin: 12px 0 4px;">
        Advance Payment:
        <span style="float: right;">Rs ${escapeHtml(pricing.advanceAmount)}</span>
      </p>

      <p style="margin: 4px 0;">
        Remaining Cash on Delivery:
        <span style="float: right;">Rs ${escapeHtml(pricing.remainingCod)}</span>
      </p>

      <div style="clear: both;"></div>
    </div>
  `;
}

async function sendMail({ to, subject, html, text }) {
  if (!smtpConfigured()) {
    return {
      sent: false,
      reason: 'SMTP is not configured',
    };
  }

  const settings = await StoreSettings.findOne({ key: 'default' }).lean();

  if (settings && settings.emailEnabled === false) {
    return {
      sent: false,
      reason: 'Email notifications are disabled in settings',
    };
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

    return {
      sent: false,
      reason: err.message,
    };
  }
}

// 1. Order Confirmation Email
async function sendOrderConfirmation(order, settings) {
  const customerName = escapeHtml(order.customer.fullName);
  const orderNumber = escapeHtml(order.orderNumber);

  const accounts = (settings.paymentAccounts || [])
    .filter((account) => account.active)
    .map((account) => `
      <li style="margin-bottom: 14px;">
        <strong>${escapeHtml(account.method)}</strong><br/>
        Account Holder: ${escapeHtml(account.holderName)}<br/>
        Account Number: ${escapeHtml(account.accountNumber)}
        ${
          account.instructions
            ? `<br/>Instructions: ${escapeHtml(account.instructions)}`
            : ''
        }
      </li>
    `)
    .join('');

  const paymentInstructions = accounts
    ? `
      <h3 style="color: #111827;">How to Complete Your Payment</h3>

      <p>
        Please transfer your advance payment using one of the payment
        accounts listed below.
      </p>

      <div style="
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 16px;
      ">
        <ul style="padding-left: 20px;">
          ${accounts}
        </ul>
      </div>

      <p>
        Once your payment is complete, please visit your order page
        and submit your transaction reference and payment screenshot
        so our team can verify your payment.
      </p>
    `
    : `
      <p>
        Your order has been placed successfully. Please visit your
        order page for the available payment methods and next steps.
      </p>
    `;

  const deadline = formatDate(order.paymentDeadlineAt);

  const subject =
    `Thank you for your order, ${order.customer.fullName} | Craftagon #${order.orderNumber}`;

  return sendMail({
    to: order.customer.email,
    subject,

    html: wrap(
      `Thank You for Your Order, ${customerName}!`,
      `
        <p>
          We're delighted that you've chosen Craftagon!
          Your order has been placed successfully, and we're excited
          to be part of your shopping experience.
        </p>

        <div style="
          background-color: #eff6ff;
          border-left: 4px solid #2563eb;
          border-radius: 6px;
          padding: 16px;
          margin: 20px 0;
        ">
          <p style="margin: 0 0 6px;">Your Order ID</p>

          <p style="
            font-size: 22px;
            font-weight: bold;
            color: #2563eb;
            margin: 0;
          ">${orderNumber}</p>

          <p style="margin: 8px 0 0;">
            Please keep this number for future reference.
          </p>
        </div>

        ${orderItemsHtml(order)}

        <h3 style="color: #111827; margin-top: 28px;">
          Complete Your Advance Payment
        </h3>

        <p>
          Your advance payment is
          <strong>Rs ${escapeHtml(order.pricing.advanceAmount)}</strong>,
          and the remaining
          <strong>Rs ${escapeHtml(order.pricing.remainingCod)}</strong>
          will be payable through Cash on Delivery.
        </p>

        ${paymentInstructions}

        <div style="
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 14px;
          margin-top: 20px;
        ">
          <strong>Payment Deadline</strong><br/>
          ${escapeHtml(deadline)}
        </div>

        <p style="margin-top: 24px;">
          Thank you for trusting Craftagon. We look forward to
          delivering your order and hope you love your purchase!
        </p>

        <p>
          Warm regards,<br/>
          <strong>Team Craftagon</strong>
        </p>
      `
    ),

    text: `
Thank You for Your Order, ${order.customer.fullName}!

We're delighted that you've chosen Craftagon. Your order has been placed successfully.

Order ID: ${order.orderNumber}

${(order.items || []).map((item) =>
  `${item.name} | Qty: ${item.quantity} | Total: Rs ${item.lineTotal}`
).join('\n')}

Subtotal: Rs ${order.pricing.subtotal}
Discount: Rs ${order.pricing.discount}
Delivery Fee: Rs ${order.pricing.deliveryFee}
Order Total: Rs ${order.pricing.total}

Advance Payment: Rs ${order.pricing.advanceAmount}
Remaining Cash on Delivery: Rs ${order.pricing.remainingCod}

${(settings.paymentAccounts || [])
  .filter((account) => account.active)
  .map((account) =>
    `${account.method}\nAccount Holder: ${account.holderName}\nAccount Number: ${account.accountNumber}\n${account.instructions || ''}`
  )
  .join('\n\n')}

Once you've transferred your advance payment, visit your order page and submit your transaction reference and payment screenshot.

Payment Deadline: ${deadline}

Thank you for trusting Craftagon!

Warm regards,
Team Craftagon
    `.trim(),
  });
}

// 2. Payment Verification Result
async function sendPaymentResult(order, verified, notes) {
  const orderNumber = escapeHtml(order.orderNumber);

  const subject = verified
    ? `Payment Confirmed! Your Order #${order.orderNumber} | Craftagon`
    : `Payment Update for Order #${order.orderNumber} | Craftagon`;

  const heading = verified
    ? 'Your Payment Has Been Verified!'
    : 'An Update About Your Payment';

  const message = verified
    ? `
      <p>
        Good news! We've successfully verified the advance payment
        for your order <strong>#${orderNumber}</strong>.
      </p>

      <div style="
        background-color: #ecfdf5;
        border-left: 4px solid #059669;
        padding: 16px;
        border-radius: 6px;
        margin: 20px 0;
      ">
        <strong style="color: #047857;">
          Payment successfully verified
        </strong>

        <p style="margin-bottom: 0;">
          Thank you for completing your payment. We'll proceed
          with the next steps for your order and keep you updated.
        </p>
      </div>
    `
    : `
      <p>
        Unfortunately, we couldn't verify the payment submitted
        for your order <strong>#${orderNumber}</strong>.
      </p>

      <div style="
        background-color: #fff7ed;
        border-left: 4px solid #ea580c;
        padding: 16px;
        border-radius: 6px;
        margin: 20px 0;
      ">
        <strong>What should you do next?</strong>

        <p style="margin-bottom: 0;">
          Please review your transaction details and payment proof.
          If needed, submit your payment information again through
          your order page.
        </p>
      </div>
    `;

  const noteHtml = notes
    ? `
      <div style="
        background-color: #f9fafb;
        padding: 14px;
        border-radius: 8px;
        margin-top: 16px;
      ">
        <strong>Additional Information</strong>
        <p style="margin-bottom: 0;">
          ${escapeHtml(notes)}
        </p>
      </div>
    `
    : '';

  return sendMail({
    to: order.customer.email,
    subject,

    html: wrap(
      heading,
      `
        <p>Dear ${escapeHtml(order.customer.fullName)},</p>

        ${message}

        ${noteHtml}

        <p>
          Thank you for your patience and for choosing Craftagon.
          We appreciate your trust in us.
        </p>

        <p>
          Warm regards,<br/>
          <strong>Team Craftagon</strong>
        </p>
      `
    ),

    text: `
Dear ${order.customer.fullName},

${verified
  ? `Good news! We've successfully verified the advance payment for your order #${order.orderNumber}. We'll proceed with the next steps for your order and keep you updated.`
  : `Unfortunately, we couldn't verify the payment submitted for your order #${order.orderNumber}. Please review your transaction details and payment proof. If needed, submit your payment information again through your order page.`}

${notes ? `Additional Information: ${notes}` : ''}

Thank you for your patience and for choosing Craftagon.

Warm regards,
Team Craftagon
    `.trim(),
  });
}

// 3. Order Cancellation Email
async function sendCancellation(order) {
  const reason =
    order.cancellation?.reason || 'The payment deadline expired';

  const subject =
    `An Update About Your Craftagon Order #${order.orderNumber}`;

  return sendMail({
    to: order.customer.email,
    subject,

    html: wrap(
      'An Update About Your Order',
      `
        <p>
          Dear ${escapeHtml(order.customer.fullName)},
        </p>

        <p>
          We're sorry to let you know that your order
          <strong>#${escapeHtml(order.orderNumber)}</strong>
          has been cancelled.
        </p>

        <div style="
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
        ">
          <strong>Reason for cancellation</strong>
          <p style="margin-bottom: 0;">
            ${escapeHtml(reason)}
          </p>
        </div>

        <p>
          We understand that plans can change, and we're sorry
          if this has caused you any inconvenience.
        </p>

        <p>
          If you'd still like to purchase these items, you're
          welcome to place a new order with Craftagon.
        </p>

        <p>
          Thank you for considering Craftagon. We hope to serve
          you again soon!
        </p>

        <p>
          Warm regards,<br/>
          <strong>Team Craftagon</strong>
        </p>
      `
    ),

    text: `
Dear ${order.customer.fullName},

We're sorry to let you know that your order #${order.orderNumber} has been cancelled.

Reason for cancellation: ${reason}

We understand that plans can change, and we're sorry if this has caused any inconvenience.

If you'd still like to purchase these items, you're welcome to place a new order with Craftagon.

Thank you for considering Craftagon. We hope to serve you again soon!

Warm regards,
Team Craftagon
    `.trim(),
  });
}

// 4. Order Dispatch Email
async function sendDispatch(order) {
  const courier = order.tracking?.courier || 'Not available';
  const trackingNumber = order.tracking?.trackingNumber || 'Not available';

  const subject =
    `Great News! Your Craftagon Order #${order.orderNumber} Is on Its Way`;

  return sendMail({
    to: order.customer.email,
    subject,

    html: wrap(
      'Your Order Is on Its Way!',
      `
        <p>
          Dear ${escapeHtml(order.customer.fullName)},
        </p>

        <p>
          Great news! Your order
          <strong>#${escapeHtml(order.orderNumber)}</strong>
          has been dispatched and is on its way to you.
        </p>

        <div style="
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 18px;
          margin: 24px 0;
        ">
          <h3 style="margin-top: 0; color: #1d4ed8;">
            Shipment Details
          </h3>

          <p>
            <strong>Courier:</strong>
            ${escapeHtml(courier)}
          </p>

          <p style="margin-bottom: 0;">
            <strong>Tracking Number:</strong>
            ${escapeHtml(trackingNumber)}
          </p>
        </div>

        <p>
          Please keep your tracking details handy so you can
          refer to them when checking your shipment status.
        </p>

        <p>
          We hope you enjoy your purchase. Thank you for shopping
          with Craftagon!
        </p>

        <p>
          Warm regards,<br/>
          <strong>Team Craftagon</strong>
        </p>
      `
    ),

    text: `
Dear ${order.customer.fullName},

Great news! Your order #${order.orderNumber} has been dispatched and is on its way to you.

Shipment Details:
Courier: ${courier}
Tracking Number: ${trackingNumber}

Please keep your tracking details handy so you can refer to them when checking your shipment status.

We hope you enjoy your purchase. Thank you for shopping with Craftagon!

Warm regards,
Team Craftagon
    `.trim(),
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