const mongoose = require("mongoose");

const couponUsageSchema = new mongoose.Schema(
  {
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: true },
    couponCode: { type: String, required: true }, // coupon delete ho jaye to bhi code history mein rahe
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    orderNumber: String,
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    discountAmount: { type: Number, required: true },
    orderTotal: Number,
    status: { type: String, enum: ["used", "released"], default: "used" }, // released = order cancel hua
    releasedAt: Date,
  },
  { timestamps: true }
);

couponUsageSchema.index({ coupon: 1, createdAt: -1 });
couponUsageSchema.index({ order: 1 });

module.exports = mongoose.model("CouponUsage", couponUsageSchema);