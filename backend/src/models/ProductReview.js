const mongoose = require("mongoose");

const productReviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, required: true, trim: true, maxlength: 80 },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    comment: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    verifiedPurchase: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

productReviewSchema.index({ order: 1, product: 1 }, { unique: true });
productReviewSchema.index({ product: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("ProductReview", productReviewSchema);
