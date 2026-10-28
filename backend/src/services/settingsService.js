const StoreSettings = require("../models/StoreSettings");
const env = require("../config/env");

const defaults = {
  storeName: "Craftagon",
  tagline: "Personalized gifts, printed with care",
  email: "hello@example.com",
  whatsappNumber: env.storeWhatsapp,
  banners: [
    {
      title: "Gifts they will keep",
      subtitle: "Custom names on pens, mugs, tumblers, diaries and more",
      image: "",
      ctaText: "Shop now",
      ctaLink: "/products",
      active: true,
    },
  ],
  faqs: [
    {
      question: "How does customization work?",
      answer: "Enter a name or short text on the product page. You will see a live preview before adding it to your cart.",
    },
    {
      question: "How do I pay?",
      answer: "Place your order, transfer the advance amount using the bank, Easypaisa, or JazzCash details shown, then upload your payment screenshot.",
    },
    {
      question: "Does this site send WhatsApp messages automatically?",
      answer: "No. WhatsApp buttons open a chat with a pre-filled message. You press Send yourself.",
    },
  ],
  policies: {
    shipping: "Orders are packed after advance payment is verified. Delivery times vary by city.",
    returns: "Customized items cannot be returned unless they arrive damaged or with a printing error.",
    privacy: "We use your contact details only to fulfill and support your order.",
  },
  delivery: { nationwideFlat: 250, cityRates: [{ city: "Karachi", province: "Sindh", fee: 200 }] },
  advance: { type: "percent", amount: 50, minAdvance: 500, productRules: [] },
  paymentAccounts: [
    {
      method: "Bank Transfer",
      holderName: "Craftagon (placeholder)",
      accountNumber: "PK00XXXX0000000000000000",
      instructions: "Transfer the advance amount and upload the receipt on the order page.",
      active: true,
    },
    {
      method: "Easypaisa",
      holderName: "Craftagon (placeholder)",
      accountNumber: "03000000000",
      instructions: "Send the advance as a transfer, then submit the transaction ID.",
      active: true,
    },
    {
      method: "JazzCash",
      holderName: "Craftagon (placeholder)",
      accountNumber: "03000000000",
      instructions: "Send the advance as a transfer, then submit the transaction ID.",
      active: true,
    },
  ],
  paymentDeadlineHours: 48,
  autoCancelEnabled: true,
};

async function getSettings() {
  let doc = await StoreSettings.findOne({ key: "default" });
  if (!doc) doc = await StoreSettings.create({ key: "default", ...defaults });
  return doc;
}

function publicSettings(doc) {
  return {
    storeName: doc.storeName,
    tagline: doc.tagline,
    email: doc.email,
    phone: doc.phone,
    whatsappNumber: doc.whatsappNumber,
    address: doc.address,
    banners: (doc.banners || []).filter((b) => b.active !== false),
    faqs: doc.faqs || [],
    policies: doc.policies || {},
    paymentAccounts: (doc.paymentAccounts || [])
      .filter((a) => a.active !== false)
      .map((a) => ({
        method: a.method,
        holderName: a.holderName,
        accountNumber: a.accountNumber,
        instructions: a.instructions,
      })),
    paymentDeadlineHours: doc.paymentDeadlineHours,
  };
}

module.exports = { getSettings, publicSettings, defaults };
