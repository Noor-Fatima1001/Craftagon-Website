const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const { body, validationResult } = require("express-validator");
const Admin = require("../models/Admin");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const PaymentSubmission = require("../models/PaymentSubmission");
const Coupon = require("../models/Coupon");
const AuditLog = require("../models/AuditLog");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { logAudit } = require("../services/audit");
const { getSettings } = require("../services/settingsService");
const { adminCancel, cancelOverdueOrders } = require("../services/cancelService");
const emailService = require("../services/emailService");
const { dirs } = require("../middleware/upload");
const { waLink, paymentReminderMessage, cancelNotifyMessage, orderConfirmMessage } = require("../utils/whatsapp");

function validate(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400, { errors: errors.array() });
}

function setAuthCookie(res, admin) {
  const token = jwt.sign({ sub: admin._id }, env.jwtSecret, { expiresIn: "12h" });
  res.cookie("admin_token", token, {
    httpOnly: true,
    secure: env.cookieSecure || env.isProd,
    sameSite: env.isProd ? "strict" : "lax",
    maxAge: 12 * 60 * 60 * 1000,
    path: "/",
  });
}

const loginValidators = [
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 8 }),
];

const login = asyncHandler(async (req, res) => {
  validate(req);
  const admin = await Admin.findOne({ email: req.body.email });
  if (!admin) throw new AppError("Invalid email or password", 401);
  const ok = await bcrypt.compare(req.body.password, admin.passwordHash);
  if (!ok) throw new AppError("Invalid email or password", 401);
  admin.lastLoginAt = new Date();
  await admin.save();
  setAuthCookie(res, admin);
  res.json({ admin: { id: admin._id, name: admin.name, email: admin.email } });
});

const logout = asyncHandler(async (_req, res) => {
  res.clearCookie("admin_token", { path: "/" });
  res.json({ ok: true });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    admin: { id: req.admin._id, name: req.admin.name, email: req.admin.email },
    email: emailService.status(),
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 10) {
    throw new AppError("New password must be at least 10 characters", 400);
  }
  const admin = await Admin.findById(req.admin._id);
  const ok = await bcrypt.compare(currentPassword || "", admin.passwordHash);
  if (!ok) throw new AppError("Current password is incorrect", 400);
  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  await admin.save();
  await logAudit({ admin: req.admin, action: "password_change", entity: "Admin", entityId: admin._id });
  res.json({ ok: true });
});

const dashboard = asyncHandler(async (_req, res) => {
  const [totalOrders, pendingPayments, verifiedPayments, cancelledOrders, salesAgg, recent] =
    await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: { $in: ["pending", "under_review"] } }),
      Order.countDocuments({ paymentStatus: "verified" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.aggregate([
        { $match: { paymentStatus: "verified", status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(8).select("orderNumber status paymentStatus total customer createdAt"),
    ]);
  res.json({
    stats: {
      totalOrders,
      pendingPayments,
      verifiedPayments,
      cancelledOrders,
      sales: salesAgg[0]?.total || 0,
      verifiedOrderCount: salesAgg[0]?.count || 0,
    },
    recent,
  });
});

const listProducts = asyncHandler(async (req, res) => {
  const products = await Product.find(req.query.q ? { name: new RegExp(String(req.query.q), "i") } : {})
    .populate("category", "name slug")
    .sort({ updatedAt: -1 });
  res.json({ products });
});

const saveProduct = asyncHandler(async (req, res) => {
  const data = req.body;
  const payload = {
    name: data.name,
    slug: String(data.slug || data.name || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    description: data.description || "",
    category: data.category,
    price: Number(data.price),
    salePrice: data.salePrice === "" || data.salePrice == null ? undefined : Number(data.salePrice),
    stock: Number(data.stock || 0),
    active: data.active !== false && data.active !== "false",
    featured: data.featured === true || data.featured === "true",
    bestseller: data.bestseller === true || data.bestseller === "true",
    customization: typeof data.customization === "string" ? JSON.parse(data.customization) : data.customization,
    preview: typeof data.preview === "string" ? JSON.parse(data.preview) : data.preview,
  };
  if (req.files?.length) {
    payload.images = req.files.map((f) => `/uploads/products/${f.filename}`);
  } else if (data.images) {
    payload.images = typeof data.images === "string" ? JSON.parse(data.images) : data.images;
  }
  let product;
  if (req.params.id) {
    product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!product) throw new AppError("Product not found", 404);
  } else {
    product = await Product.create(payload);
  }
  await logAudit({
    admin: req.admin,
    action: req.params.id ? "product_update" : "product_create",
    entity: "Product",
    entityId: product._id,
  });
  res.json({ product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!product) throw new AppError("Product not found", 404);
  await logAudit({ admin: req.admin, action: "product_deactivate", entity: "Product", entityId: product._id });
  res.json({ product });
});

const listCategories = asyncHandler(async (_req, res) => {
  res.json({ categories: await Category.find().sort({ sortOrder: 1 }) });
});

const saveCategory = asyncHandler(async (req, res) => {
  const slug = String(req.body.slug || req.body.name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const payload = { ...req.body, slug };
  let category;
  if (req.params.id) {
    category = await Category.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  } else {
    category = await Category.create(payload);
  }
  res.json({ category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

const listOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.q) {
    const q = String(req.query.q);
    filter.$or = [
      { orderNumber: new RegExp(q, "i") },
      { "customer.fullName": new RegExp(q, "i") },
      { "customer.email": new RegExp(q, "i") },
      { "customer.phone": new RegExp(q, "i") },
    ];
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ orders });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);
  const payments = await PaymentSubmission.find({ order: order._id }).sort({ createdAt: -1 });
  const settings = await getSettings();
  res.json({
    order,
    payments,
    whatsapp: {
      confirm: waLink(settings.whatsappNumber, orderConfirmMessage(order, settings.storeName)),
      reminder: waLink(settings.whatsappNumber, paymentReminderMessage(order)),
      cancel: waLink(settings.whatsappNumber, cancelNotifyMessage(order)),
    },
  });
});

const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);
  const { status, courierName, trackingNumber, note } = req.body;
  if (status === "cancelled") {
    await adminCancel(order, note || "Cancelled by admin", req.admin);
  } else if (status) {
    if (status === "dispatched") {
      order.courierName = courierName || order.courierName;
      order.trackingNumber = trackingNumber || order.trackingNumber;
      order.dispatchedAt = new Date();
      const mail = await emailService.orderDispatched(order);
      order.history.push({
        status,
        note: mail.sent ? "Dispatch email sent" : `Dispatch email not sent: ${mail.reason || "not configured"}`,
      });
    }
    if (status === "delivered") order.deliveredAt = new Date();
    order.status = status;
    order.history.push({ status, note: note || `Status updated to ${status}` });
    await order.save();
  } else {
    if (courierName != null) order.courierName = courierName;
    if (trackingNumber != null) order.trackingNumber = trackingNumber;
    await order.save();
  }
  await logAudit({
    admin: req.admin,
    action: "order_update",
    entity: "Order",
    entityId: order._id,
    details: { status, courierName, trackingNumber },
  });
  res.json({ order });
});

const listPayments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const payments = await PaymentSubmission.find(filter)
    .populate("order", "orderNumber total advanceAmount customer paymentStatus status")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ payments });
});

const reviewPayment = asyncHandler(async (req, res) => {
  const payment = await PaymentSubmission.findById(req.params.id);
  if (!payment) throw new AppError("Payment not found", 404);
  const { decision, adminNotes } = req.body;
  if (!["verified", "rejected"].includes(decision)) throw new AppError("Decision must be verified or rejected", 400);
  const order = await Order.findById(payment.order);
  if (!order) throw new AppError("Order not found", 404);
  payment.status = decision;
  payment.adminNotes = adminNotes || "";
  payment.reviewedAt = new Date();
  payment.reviewedBy = req.admin._id;
  await payment.save();
  order.paymentStatus = decision;
  if (decision === "verified") {
    if (["pending_payment", "payment_submitted"].includes(order.status)) order.status = "confirmed";
    order.history.push({ status: "confirmed", note: `Payment verified. ${adminNotes || ""}` });
  } else {
    order.status = "pending_payment";
    order.history.push({ status: "pending_payment", note: `Payment rejected. ${adminNotes || ""}` });
  }
  await order.save();
  const mail = await emailService.paymentResult(order, decision === "verified", adminNotes);
  await logAudit({
    admin: req.admin,
    action: "payment_review",
    entity: "PaymentSubmission",
    entityId: payment._id,
    details: { decision, order: order.orderNumber, emailSent: mail.sent },
  });
  res.json({ payment, order, email: mail });
});

const paymentScreenshot = asyncHandler(async (req, res) => {
  const payment = await PaymentSubmission.findById(req.params.id);
  if (!payment) throw new AppError("Payment not found", 404);
  const filePath = path.join(dirs.payments, payment.screenshotPath);
  if (!fs.existsSync(filePath)) throw new AppError("File not found", 404);
  res.sendFile(filePath);
});

const getSettingsAdmin = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  res.json({ settings, email: emailService.status() });
});

const saveSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const allowed = [
    "storeName",
    "tagline",
    "email",
    "phone",
    "whatsappNumber",
    "address",
    "banners",
    "featuredProductIds",
    "faqs",
    "policies",
    "delivery",
    "advance",
    "paymentAccounts",
    "paymentDeadlineHours",
    "autoCancelEnabled",
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) settings[key] = req.body[key];
  }
  await settings.save();
  await logAudit({
    admin: req.admin,
    action: "settings_update",
    entity: "StoreSettings",
    entityId: settings._id,
    details: { keys: Object.keys(req.body) },
  });
  res.json({ settings });
});

const listCoupons = asyncHandler(async (_req, res) => {
  res.json({ coupons: await Coupon.find().sort({ createdAt: -1 }) });
});

const saveCoupon = asyncHandler(async (req, res) => {
  const payload = { ...req.body, code: String(req.body.code || "").toUpperCase().trim() };
  let coupon;
  if (req.params.id) coupon = await Coupon.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  else coupon = await Coupon.create(payload);
  res.json({ coupon });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

const reports = asyncHandler(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 86400000);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const match = { createdAt: { $gte: from, $lte: to } };
  const byDay = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        orders: { $sum: 1 },
        sales: { $sum: "$total" },
        verified: { $sum: { $cond: [{ $eq: ["$paymentStatus", "verified"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.json({ from, to, byDay });
});

const runCancelJob = asyncHandler(async (_req, res) => {
  const result = await cancelOverdueOrders();
  res.json(result);
});

const auditLogs = asyncHandler(async (_req, res) => {
  const logs = await AuditLog.find().populate("admin", "email name").sort({ createdAt: -1 }).limit(100);
  res.json({ logs });
});

module.exports = {
  loginValidators,
  login,
  logout,
  me,
  changePassword,
  dashboard,
  listProducts,
  saveProduct,
  deleteProduct,
  listCategories,
  saveCategory,
  deleteCategory,
  listOrders,
  getOrder,
  updateOrder,
  listPayments,
  reviewPayment,
  paymentScreenshot,
  getSettingsAdmin,
  saveSettings,
  listCoupons,
  saveCoupon,
  deleteCoupon,
  reports,
  runCancelJob,
  auditLogs,
};
