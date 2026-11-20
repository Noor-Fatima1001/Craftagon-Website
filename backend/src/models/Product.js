const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    images: [{ type: String }],
    colorVariants: [
      {
        name: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
        image: { type: String, default: "" },
      },
    ],
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    stock: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    customization: {
      enabled: { type: Boolean, default: true },
      required: { type: Boolean, default: true },
      maxLength: { type: Number, default: 24 },
      label: { type: String, default: "Custom text" },
    },
    preview: {
      enabled: { type: Boolean, default: true },
      x: { type: Number, default: 50 },
      y: { type: Number, default: 55 },
      fontSize: { type: Number, default: 22 },
      fontFamily: { type: String, default: "Georgia, serif" },
      color: { type: String, default: "#1f2937" },
      align: { type: String, enum: ["left", "center", "right"], default: "center" },
      maxWidth: { type: Number, default: 70 },
      rotation: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

productSchema.index({ active: 1, category: 1 });
productSchema.index({ name: "text", description: "text" });

productSchema.virtual("effectivePrice").get(function effectivePrice() {
  if (this.salePrice != null && this.salePrice > 0 && this.salePrice < this.price) {
    return this.salePrice;
  }
  return this.price;
});

module.exports = mongoose.model("Product", productSchema);
