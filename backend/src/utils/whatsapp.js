function digitsOnly(n = "") {
  return String(n).replace(/\D/g, "");
}

function whatsappLink(number, message) {
  const n = digitsOnly(number);
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

function waLink(number, message) {
  return whatsappLink(number, message);
}

function orderWhatsAppMessage(order, settings) {
  const accounts = (settings.paymentAccounts || [])
    .filter((a) => a.active !== false)
    .map((a) => `${a.method}: ${a.holderName} ${a.accountNumber}`)
    .join("\n");
  return `Hello ${settings.storeName || "Craftagon"}, I placed order ${order.orderNumber}.
Advance due: Rs ${order.advanceAmount}
Remaining COD: Rs ${order.remainingCod}

Please note I will transfer using:
${accounts}
`;
}

function orderConfirmMessage(order, storeName) {
  return `Hello, this is ${storeName || "Craftagon"} regarding order ${order.orderNumber}. Your order is confirmed.`;
}

function paymentReminderMessage(order) {
  return `Hello, a reminder for order ${order.orderNumber}: advance due is Rs ${order.advanceAmount}. Remaining COD is Rs ${order.remainingCod}.`;
}

function cancelNotifyMessage(order) {
  return `Hello, order ${order.orderNumber} has been cancelled${order.cancelReason ? `: ${order.cancelReason}` : ""}.`;
}

module.exports = {
  digitsOnly,
  whatsappLink,
  waLink,
  orderWhatsAppMessage,
  orderConfirmMessage,
  paymentReminderMessage,
  cancelNotifyMessage,
};
