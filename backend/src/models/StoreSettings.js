const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    storeName: { type: String, default: "Craftagon" },
    tagline: { type: String, default: "Personalized gifts, printed with care" },
    email: { type: String, default: "noor525439@gmail.com" },
    phone: { type: String, default: "" },
    whatsappNumber: { type: String, default: "923000000000" },
    address: { type: String, default: "" },
    about: {
      title: { type: String, default: "About Craftagon" },
      body: {
        type: String,
        default:
          "Craftagon prints names and short messages onto pens, mugs, tumblers, diaries and keychains. We confirm advance payments before we print.",
      },
    },
    help: {
      title: { type: String, default: "Help & Support" },
      body: {
        type: String,
        default:
          "Need help with an order or a payment? Use Track Order with your order number and email, or send us a message on the Contact page. WhatsApp buttons only open a chat — nothing is sent until you press Send.",
      },
    },
    banners: { type: String, default: "" },
    featuredProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    faqs: { type: String, default: "" },
    policies: { type: String, default: "" },
    delivery: {
      nationwideFlat: { type: Number, default: 250 },
      cityRates: { type: String, default: "" },
    },
    advance: {
      type: { type: String, enum: ["fixed", "percent"], default: "percent" },
      amount: { type: Number, default: 50 },
      minAdvance: { type: Number, default: 500 },
      productRules: [
        {
          product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
          type: { type: String, enum: ["fixed", "percent"] },
          amount: Number,
        },
      ],
    },
    paymentAccounts: { type: String, default: "" },
    paymentDeadlineHours: { type: Number, default: 48 },
    autoCancelEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);
