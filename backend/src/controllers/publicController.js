const { body, query, validationResult } = require("express-validator");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const PaymentSubmission = require("../models/PaymentSubmission");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { getSettings, publicSettings } = require("../services/settingsService");
const { quote } = require("../services/pricingService");
const { createOrder, publicOrder } = require("../services/orderService");
const { waLink, orderConfirmMessage } = require("../utils/whatsapp");

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, { errors: errors.array() });
  }
}

const listProducts = asyncHandler(async (req, res) => {
  const { q, category, sort = "newest", featured, bestseller } = req.query;
  const filter = { active: true };
  if (q) filter.name = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (category) {
    const cat = await Category.findOne({ slug: category, active: true });
    if (cat) filter.category = cat._id;
    else filter.category = null;
  }
  if (featured === "true") filter.featured = true;
  if (bestseller === "true") filter.bestseller = true;
  let queryBuilder = Product.find(filter).populate("category", "name slug");
  if (sort === "price_asc") queryBuilder = queryBuilder.sort({ price: 1 });
  else if (sort === "price_desc") queryBuilder = queryBuilder.sort({ price: -1 });
  else if (sort === "name") queryBuilder = queryBuilder.sort({ name: 1 });
  else queryBuilder = queryBuilder.sort({ createdAt: -1 });
  const products = await queryBuilder.lean();
  res.json({ products });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, active: true }).populate(
    "category",
    "name slug"
  );
  if (!product) throw new AppError("Product not found", 404);
  res.json({ product });
});

const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ categories });
});

const getStore = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  const featured = await Product.find({
    active: true,
    $or: [{ featured: true }, { _id: { $in: settings.featuredProductIds || [] } }],
  })
    .limit(8)
    .populate("category", "name slug");
  const bestsellers = await Product.find({ active: true, bestseller: true })
    .limit(8)
    .populate("category", "name slug");
  res.json({ store: publicSettings(settings), featured, bestsellers });
});

const quoteValidators = [
  body("items").isArray({ min: 1 }).withMessage("Cart is empty"),
  body("items.*.productId").isMongoId(),
  body("items.*.quantity").isInt({ min: 1, max: 50 }),
  body("city").optional().isString(),
  body("province").optional().isString(),
  body("couponCode").optional().isString(),
];

const postQuote = asyncHandler(async (req, res) => {
  validate(req);
  const settings = await getSettings();
  const ProductModel = require("../models/Product");
  const ids = req.body.items.map((i) => i.productId);
  const products = await ProductModel.find({ _id: { $in: ids } });
  const productsById = new Map(products.map((p) => [String(p._id), p]));
  const priced = await quote({
    productsById,
    cartItems: req.body.items,
    settings,
    city: req.body.city,
    province: req.body.province,
    couponCode: req.body.couponCode,
  });
  res.json({
    subtotal: priced.subtotal,
    deliveryFee: priced.deliveryFee,
    discount: priced.discount,
    couponCode: priced.couponCode,
    total: priced.total,
    advanceAmount: priced.advanceAmount,
    remainingCod: priced.remainingCod,
    items: priced.items,
  });
});

const orderValidators = [
  body("idempotencyKey").isString().isLength({ min: 8, max: 80 }),
  body("items").isArray({ min: 1 }),
  body("items.*.productId").isMongoId(),
  body("items.*.quantity").isInt({ min: 1, max: 50 }),
  body("customer.fullName").trim().isLength({ min: 3, max: 80 }),
  body("customer.phone").trim().isLength({ min: 10, max: 20 }),
  body("customer.email").isEmail().normalizeEmail(),
  body("customer.province").trim().notEmpty(),
  body("customer.city").trim().notEmpty(),
  body("customer.address").trim().isLength({ min: 8, max: 300 }),
  body("customer.landmark").optional().isString().isLength({ max: 120 }),
  body("customer.notes").optional().isString().isLength({ max: 400 }),
];

const postOrder = asyncHandler(async (req, res) => {
  validate(req);
  const { order, duplicate, email } = await createOrder({
    cartItems: req.body.items,
    customer: req.body.customer,
    couponCode: req.body.couponCode,
    idempotencyKey: req.body.idempotencyKey,
  });
  const settings = await getSettings();
  const message = orderConfirmMessage(order, settings.storeName);
  res.status(duplicate ? 200 : 201).json({
    order: publicOrder(order, { includeToken: true, includeCustomer: true }),
    duplicate,
    email,
    whatsappUrl: waLink(settings.whatsappNumber, message),
    paymentAccounts: publicSettings(settings).paymentAccounts,
  });
});

const lookupOrder = asyncHandler(async (req, res) => {
  const { orderNumber, email, token } = req.query;
  if (!orderNumber) throw new AppError("Order number is required", 400);
  const order = await Order.findOne({ orderNumber: String(orderNumber).toUpperCase() });
  if (!order) throw new AppError("Order not found", 404);
  const emailOk = email && String(email).toLowerCase() === order.customer.email;
  const tokenOk = token && token === order.lookupToken;
  if (!emailOk && !tokenOk) throw new AppError("Order not found", 404);
  const settings = await getSettings();
  const submissions = await PaymentSubmission.find({ order: order._id })
    .select("-screenshotPath")
    .sort({ createdAt: -1 });
  res.json({
    order: publicOrder(order, { includeToken: true, includeCustomer: true, includeHistory: true }),
    payments: submissions,
    whatsappUrl: waLink(settings.whatsappNumber, orderConfirmMessage(order, settings.storeName)),
    paymentAccounts: publicSettings(settings).paymentAccounts,
  });
});

const submitPayment = asyncHandler(async (req, res) => {
  const { orderNumber, token, method, transactionRef, customerNote } = req.body;
  if (!req.file) throw new AppError("Payment screenshot is required", 400);
  if (!transactionRef || !method) throw new AppError("Method and transaction reference are required", 400);
  const order = await Order.findOne({ orderNumber: String(orderNumber).toUpperCase() });
  if (!order || token !== order.lookupToken) throw new AppError("Order not found", 404);
  if (order.status === "cancelled") throw new AppError("This order is cancelled", 400);
  if (order.paymentStatus === "verified") throw new AppError("Payment is already verified", 400);

  const submission = await PaymentSubmission.create({
    order: order._id,
    method,
    transactionRef: String(transactionRef).trim(),
    screenshotPath: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    status: "under_review",
    customerNote: customerNote || "",
  });
  order.paymentStatus = "under_review";
  order.status = "payment_submitted";
  order.history.push({ status: "payment_submitted", note: `Payment submitted (${method})` });
  await order.save();
  res.status(201).json({
    payment: {
      id: submission._id,
      status: submission.status,
      method: submission.method,
      transactionRef: submission.transactionRef,
      createdAt: submission.createdAt,
    },
    order: publicOrder(order, { includeToken: true, includeCustomer: true }),
  });
});

module.exports = {
  listProducts,
  getProduct,
  listCategories,
  getStore,
  quoteValidators,
  postQuote,
  orderValidators,
  postOrder,
  lookupOrder,
  submitPayment,
  query,
};
