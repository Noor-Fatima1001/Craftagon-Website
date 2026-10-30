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
const AuditLog = require("../models/AuditLog");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { logAudit } = require("../services/audit");
const {
  getSettings,
  getSettingsDocument,
  decodeRows,
} = require("../services/settingsService");
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
  const filter = {};
  if (req.query.q) filter.name = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (req.query.category) filter.category = req.query.category;
  if (req.query.active === "true") filter.active = true;
  if (req.query.active === "false") filter.active = false;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("category", "name slug")
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json({ products, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category", "name slug");
  if (!product) throw new AppError("Product not found", 404);
  res.json({ product });
});

const saveProduct = asyncHandler(async (req, res) => {
  const data = req.body;
  const categoryExists = await Category.exists({ _id: data.category });
  if (!categoryExists) throw new AppError("A valid category is required", 400);
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
    stock: data.stock == null ? undefined : Number(data.stock),
    active: data.active !== false && data.active !== "false",
    featured: data.featured === true || data.featured === "true",
    bestseller: data.bestseller === true || data.bestseller === "true",
    customization: typeof data.customization === "string" ? JSON.parse(data.customization) : data.customization,
    preview: typeof data.preview === "string" ? JSON.parse(data.preview) : data.preview,
  };
  let existingImages = [];
  if (data.images) {
    existingImages = typeof data.images === "string" ? JSON.parse(data.images) : data.images;
    if (!Array.isArray(existingImages)) existingImages = [];
  }
  if (req.files?.length) {
    payload.images = [
      ...existingImages.filter((u) => typeof u === "string" && u.startsWith("/uploads/")),
      ...req.files.map((f) => `/uploads/products/${f.filename}`),
    ];
  } else if (data.images) {
    payload.images = existingImages;
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
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError("Product not found", 404);
  await logAudit({ admin: req.admin, action: "product_delete", entity: "Product", entityId: product._id });
  res.json({ ok: true, id: product._id });
});

const listCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.q) {
    filter.name = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }
  if (req.query.active === "true") filter.active = true;
  if (req.query.active === "false") filter.active = false;
  res.json({ categories: await Category.find(filter).sort({ sortOrder: 1, name: 1 }) });
});

const saveCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) throw new AppError("Category name is required", 400);
  const slug = String(req.body.slug || name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) throw new AppError("Category slug is required", 400);
  const payload = {
    name,
    slug,
    description: req.body.description || "",
    sortOrder: Number(req.body.sortOrder) || 0,
    active: req.body.active !== false && req.body.active !== "false",
  };
  if (req.body.image !== undefined) payload.image = req.body.image;
  let category;
  if (req.params.id) {
    category = await Category.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!category) throw new AppError("Category not found", 404);
  } else {
    category = await Category.create(payload);
  }
  await logAudit({
    admin: req.admin,
    action: req.params.id ? "category_update" : "category_create",
    entity: "Category",
    entityId: category._id,
  });
  res.json({ category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError("Category not found", 404);
  if (await Product.exists({ category: category._id })) {
    throw new AppError("Reassign or delete this category's products before deleting it", 409);
  }
  await Category.deleteOne({ _id: category._id });
  await logAudit({
    admin: req.admin,
    action: "category_delete",
    entity: "Category",
    entityId: category._id,
  });
  res.json({ ok: true });
});

const listOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.q) {
    const q = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { orderNumber: new RegExp(q, "i") },
      { "customer.fullName": new RegExp(q, "i") },
      { "customer.email": new RegExp(q, "i") },
      { "customer.phone": new RegExp(q, "i") },
    ];
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json({ orders, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
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
  if (req.query.method) filter.method = new RegExp(String(req.query.method), "i");
  const payments = await PaymentSubmission.find(filter)
    .populate("order", "orderNumber total advanceAmount remainingCod customer paymentStatus status")
    .sort({ createdAt: -1 })
    .limit(200);
  let list = payments;
  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    list = payments.filter((p) => {
      const hay = [
        p.order?.orderNumber,
        p.order?.customer?.fullName,
        p.order?.customer?.email,
        p.order?.customer?.phone,
        p.method,
        p.transactionRef,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }
  res.json({ payments: list });
});

const reviewPayment = asyncHandler(async (req, res) => {
  const payment = await PaymentSubmission.findById(req.params.id);
  if (!payment) throw new AppError("Payment not found", 404);
  if (["verified", "rejected"].includes(payment.status)) {
    throw new AppError("This payment was already reviewed", 400);
  }
  const { decision, adminNotes, rejectionReason } = req.body;
  if (!["verified", "rejected"].includes(decision)) throw new AppError("Decision must be verified or rejected", 400);
  if (decision === "rejected") {
    const reason = String(rejectionReason || adminNotes || "").trim();
    if (reason.length < 4) throw new AppError("A rejection reason is required", 400);
  }
  const order = await Order.findById(payment.order);
  if (!order) throw new AppError("Order not found", 404);
  payment.status = decision;
  payment.adminNotes = adminNotes || rejectionReason || "";
  payment.rejectionReason = decision === "rejected" ? String(rejectionReason || adminNotes || "").trim() : "";
  payment.reviewedAt = new Date();
  payment.reviewedBy = req.admin._id;
  await payment.save();
  if (decision === "verified") {
    await PaymentSubmission.updateMany(
      { order: order._id, _id: { $ne: payment._id }, status: "under_review" },
      {
        status: "rejected",
        rejectionReason: "Superseded by a verified payment",
        reviewedAt: new Date(),
        reviewedBy: req.admin._id,
      }
    );
    order.paymentStatus = "verified";
    if (["pending_payment", "payment_submitted"].includes(order.status)) order.status = "confirmed";
    order.history.push({ status: order.status, note: `Payment verified. ${adminNotes || ""}` });
  } else {
    const other = await PaymentSubmission.exists({
      order: order._id,
      _id: { $ne: payment._id },
      status: "under_review",
    });
    if (!other) {
      order.paymentStatus = "rejected";
      if (order.status === "payment_submitted") order.status = "pending_payment";
    }
    order.history.push({
      status: order.status,
      note: `Payment rejected: ${payment.rejectionReason}`,
    });
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
  if (!payment.screenshotPath) throw new AppError("No screenshot for this payment", 404);
  const filePath = path.join(dirs.payments, payment.screenshotPath);
  if (!fs.existsSync(filePath)) throw new AppError("File not found", 404);
  res.sendFile(filePath);
});

const getSettingsAdmin = asyncHandler(async (_req, res) => {
  const settings = await getSettingsDocument();
  res.json({ settings, email: emailService.status() });
});

const saveSettings = asyncHandler(async (req, res) => {
  const settings = await getSettingsDocument();
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
    "about",
    "help",
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === "delivery") continue;
      if (key === "banners" || key === "faqs" || key === "paymentAccounts") {
        decodeRows(req.body[key], key);
      } else if (key === "policies") {
        decodeRows(req.body[key], key);
      }
      settings[key] = req.body[key];
    }
  }
  if (req.body.delivery !== undefined) {
    if (!req.body.delivery || typeof req.body.delivery !== "object" || Array.isArray(req.body.delivery)) {
      throw new AppError("Delivery settings must be an object", 400);
    }
    if (req.body.delivery.cityRates !== undefined) {
      decodeRows(req.body.delivery.cityRates, "cityRates");
      settings.set("delivery.cityRates", req.body.delivery.cityRates);
    }
    if (req.body.delivery.nationwideFlat !== undefined) {
      settings.set("delivery.nationwideFlat", req.body.delivery.nationwideFlat);
    }
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
  getProduct,
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
  reports,
  runCancelJob,
  auditLogs,
};
