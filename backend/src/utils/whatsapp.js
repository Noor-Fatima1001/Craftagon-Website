function digitsOnly(n = '') {
  return String(n).replace(/\D/g, '');
}

function whatsappLink(number, message) {
  const n = digitsOnly(number);
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

function orderWhatsAppMessage(order, settings) {
  const accounts = (settings.paymentAccounts || [])
    .filter((a) => a.active)
    .map((a) => `${a.method}: ${a.holderName} ${a.accountNumber}`)
    .join('\n');
  return `Hello Craftagon, I placed order ${order.orderNumber}.
Advance due: Rs ${order.pricing.advanceAmount}
Remaining COD: Rs ${order.pricing.remainingCod}

Please send payment confirmation after I transfer to:
${accounts}

I will press Send in WhatsApp myself — this link does not send automatically.`;
}

module.exports = { digitsOnly, whatsappLink, orderWhatsAppMessage };
