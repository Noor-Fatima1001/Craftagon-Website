const mongoose = require("mongoose");

const reviewRequestSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    orderNumber: { type: String, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productSlug: { type: String, required: true },
    productImage: { type: String, default: "" },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerName: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    emailStatus: {
      type: String,
      enum: ["pending", "sending", "sent", "failed"],
      default: "pending",
      index: true,
    },
    emailSentAt: Date,
    emailError: { type: String, default: "" },
    sendingStartedAt: Date,
    consumedAt: Date,
  },
  { timestamps: true }
);

reviewRequestSchema.index({ order: 1, product: 1 }, { unique: true });
reviewRequestSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("ReviewRequest", reviewRequestSchema);
