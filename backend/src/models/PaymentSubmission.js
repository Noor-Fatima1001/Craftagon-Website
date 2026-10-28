const mongoose = require("mongoose");

const paymentSubmissionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    method: { type: String, required: true, trim: true },
    transactionRef: { type: String, required: true, trim: true },
    screenshotPath: { type: String, required: true },
    originalName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "under_review", "verified", "rejected"],
      default: "under_review",
      index: true,
    },
    customerNote: { type: String, default: "" },
    adminNotes: { type: String, default: "" },
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentSubmission", paymentSubmissionSchema);
