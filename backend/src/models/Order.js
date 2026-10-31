const mongoose = require("mongoose");

const orderColorSchema = new mongoose.Schema(
  {
    variantId: String,
    name: String,
    value: String,
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    slug: String,
    image: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    customText: { type: String, default: "" },
    color: { type: orderColorSchema, default: undefined },
    preview: { type: mongoose.Schema.Types.Mixed },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    lookupToken: { type: String, required: true, unique: true },
    idempotencyKey: { type: String, unique: true, sparse: true },
    customer: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      province: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
      landmark: { type: String, default: "" },
      notes: { type: String, default: "" },
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    total: { type: Number, required: true },
    advanceAmount: { type: Number, required: true },
    remainingCod: { type: Number, required: true },
    pricingSnapshot: { type: mongoose.Schema.Types.Mixed },
    status: {
      type: String,
      enum: [
        "pending_payment",
        "payment_submitted",
        "confirmed",
        "processing",
        "dispatched",
        "delivered",
        "cancelled",
      ],
      default: "pending_payment",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "under_review", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    paymentDeadlineAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    autoCancelled: { type: Boolean, default: false },
    cancelEmailSentAt: Date,
    courierName: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    dispatchedAt: Date,
    deliveredAt: Date,
    history: [
      {
        at: { type: Date, default: Date.now },
        status: String,
        note: String,
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ "customer.email": 1, createdAt: -1 });
orderSchema.index({ status: 1, paymentStatus: 1, paymentDeadlineAt: 1 });

module.exports = mongoose.model("Order", orderSchema);
