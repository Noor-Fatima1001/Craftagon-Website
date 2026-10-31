const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const PaymentSubmission = require("../models/PaymentSubmission");
const Customer = require("../models/Customer");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { getSettings, publicSettings } = require("../services/settingsService");
const { quote } = require("../services/pricingService");
const { createOrder, publicOrder } = require("../services/orderService");
const { whatsappLink, orderWhatsAppMessage } = require("../utils/whatsapp");
const { normalizeOrderNumber } = require("../utils/ids");
const emailService = require("../services/emailService");

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400, { errors: errors.array() });
  }
}

function setCustomerCookie(res, customer) {
  const token = jwt.sign({ sub: customer._id, role: "customer" }, env.jwtSecret, { expiresIn: "14d" });
  res.cookie("customer_token", token, {
    httpOnly: true,
    secure: env.cookieSecure || env.isProd,
    sameSite: env.isProd ? "strict" : "lax",
    maxAge: 14 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function publicCustomer(customer) {
  return {
    id: customer._id,
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone,
  };
}

function isCodMethod(method) {
  return /^cod$/i.test(String(method || "").trim()) || /cash on delivery/i.test(String(method || ""));
}

const listProducts = asyncHandler(async (req, res) => {
  const { q, category, sort = "newest", featured, bestseller } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
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
  const total = await Product.countDocuments(filter);
  const products = await queryBuilder
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  res.json({ products, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
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
  body("items.*.colorVariantId").optional().isMongoId(),
  body("city").optional().isString(),
  body("province").optional().isString(),
];

const postQuote = asyncHandler(async (req, res) => {
  validate(req);
  const settings = await getSettings();
  const ids = req.body.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids } });
  const productsById = new Map(products.map((p) => [String(p._id), p]));
  const priced = await quote({
    productsById,
    cartItems: req.body.items,
    settings,
    city: req.body.city,
    province: req.body.province,
  });
  res.json({
    subtotal: priced.subtotal,
    deliveryFee: priced.deliveryFee,
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
  body("items.*.colorVariantId").optional().isMongoId(),
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
    idempotencyKey: req.body.idempotencyKey,
  });
  const settings = await getSettings();
  const message = orderWhatsAppMessage(order, settings);
  res.status(duplicate ? 200 : 201).json({
    order: publicOrder(order, { includeToken: true, includeCustomer: true }),
    duplicate,
    email,
    whatsappUrl: whatsappLink(settings.whatsappNumber, message),
    paymentAccounts: publicSettings(settings).paymentAccounts,
  });
});

const lookupOrder = asyncHandler(async (req, res) => {
  const { orderNumber, email, token } = req.query;
  if (!orderNumber) throw new AppError("Order number is required", 400);
  const order = await Order.findOne({ orderNumber: normalizeOrderNumber(orderNumber) });
  if (!order) throw new AppError("Order not found", 404);
  const emailOk = email && String(email).toLowerCase().trim() === String(order.customer.email).toLowerCase();
  const tokenOk = token && token === order.lookupToken;
  if (!emailOk && !tokenOk) throw new AppError("Order not found", 404);
  const settings = await getSettings();
  const submissions = await PaymentSubmission.find({ order: order._id })
    .select("-screenshotPath")
    .sort({ createdAt: -1 });
  res.json({
    order: publicOrder(order, { includeToken: true, includeCustomer: true, includeHistory: true }),
    payments: submissions,
    whatsappUrl: whatsappLink(settings.whatsappNumber, orderWhatsAppMessage(order, settings)),
    paymentAccounts: publicSettings(settings).paymentAccounts,
  });
});

const submitPayment = asyncHandler(async (req, res) => {
  const { orderNumber, token, method, transactionRef, customerNote } = req.body;
  const cod = isCodMethod(method);
  if (!cod && !req.file) throw new AppError("Payment screenshot is required", 400);
  if (!method) throw new AppError("Payment method is required", 400);
  if (!cod && !transactionRef) throw new AppError("Transaction reference is required", 400);
  const order = await Order.findOne({ orderNumber: normalizeOrderNumber(orderNumber) });
  if (!order || token !== order.lookupToken) throw new AppError("Order not found", 404);
  if (order.status === "cancelled") throw new AppError("This order is cancelled", 400);
  if (order.paymentStatus === "verified") throw new AppError("Payment is already verified", 400);

  const submission = await PaymentSubmission.create({
    order: order._id,
    method,
    transactionRef: String(transactionRef || (cod ? "COD" : "")).trim(),
    screenshotPath: req.file?.filename || "",
    originalName: req.file?.originalname || "",
    mimeType: req.file?.mimetype || "",
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

const registerValidators = [
  body("fullName").trim().isLength({ min: 3, max: 80 }),
  body("email").isEmail().normalizeEmail(),
  body("phone").trim().isLength({ min: 10, max: 20 }),
  body("password").isString().isLength({ min: 8, max: 80 }),
];

const register = asyncHandler(async (req, res) => {
  validate(req);
  const exists = await Customer.findOne({ email: req.body.email });
  if (exists) throw new AppError("An account with this email already exists", 400);
  const customer = await Customer.create({
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    passwordHash: await Customer.hashPassword(req.body.password),
  });
  setCustomerCookie(res, customer);
  res.status(201).json({ customer: publicCustomer(customer) });
});

const loginValidators = [
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 8 }),
];

const login = asyncHandler(async (req, res) => {
  validate(req);
  const customer = await Customer.findOne({ email: req.body.email });
  if (!customer || !(await customer.checkPassword(req.body.password))) {
    throw new AppError("Invalid email or password", 401);
  }
  setCustomerCookie(res, customer);
  res.json({ customer: publicCustomer(customer) });
});

const logout = asyncHandler(async (_req, res) => {
  res.clearCookie("customer_token", { path: "/" });
  res.json({ ok: true });
});

const me = asyncHandler(async (req, res) => {
  res.json({ customer: publicCustomer(req.customer) });
});

const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ "customer.email": req.customer.email }).sort({ createdAt: -1 }).limit(50);
  res.json({
    orders: orders.map((o) => publicOrder(o, { includeCustomer: true })),
  });
});

const contactValidators = [
  body("fullName").trim().isLength({ min: 3, max: 80 }),
  body("email").isEmail().normalizeEmail(),
  body("phone").optional().isString().isLength({ max: 20 }),
  body("message").trim().isLength({ min: 10, max: 2000 }),
];

const postContact = asyncHandler(async (req, res) => {
  validate(req);
  const settings = await getSettings();
  const to = settings.email || env.smtp.from;
  const mail = await emailService.sendMail({
    to,
    subject: `Contact form: ${req.body.fullName}`,
    html: `<p>${req.body.fullName} (${req.body.email}${req.body.phone ? `, ${req.body.phone}` : ""})</p><p>${String(
      req.body.message
    ).replace(/</g, "&lt;")}</p>`,
  });
  res.json({
    ok: true,
    email: mail,
    message: mail.sent
      ? "Message sent. We will reply by email."
      : "Message received on the server, but email is not configured so staff will not get an inbox copy until SMTP is set.",
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
  registerValidators,
  register,
  loginValidators,
  login,
  logout,
  me,
  myOrders,
  contactValidators,
  postContact,
};
