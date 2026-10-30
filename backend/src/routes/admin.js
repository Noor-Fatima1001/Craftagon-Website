const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAdmin, requireCronSecret } = require("../middleware/auth");
const { productUpload, bannerUpload } = require("../middleware/upload");
const a = require("../controllers/adminController");

const router = express.Router();

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts" },
});

router.post("/auth/login", loginLimit, a.loginValidators, a.login);
router.post("/auth/logout", a.logout);
router.get("/auth/me", requireAdmin, a.me);
router.patch("/auth/password", requireAdmin, a.changePassword);

router.get("/dashboard", requireAdmin, a.dashboard);
router.get("/reports", requireAdmin, a.reports);
router.get("/audit", requireAdmin, a.auditLogs);

router.get("/products", requireAdmin, a.listProducts);
router.get("/products/:id", requireAdmin, a.getProduct);
router.post("/products", requireAdmin, productUpload.array("images", 6), a.saveProduct);
router.put("/products/:id", requireAdmin, productUpload.array("images", 6), a.saveProduct);
router.delete("/products/:id", requireAdmin, a.deleteProduct);

router.get("/categories", requireAdmin, a.listCategories);
router.post("/categories", requireAdmin, a.saveCategory);
router.put("/categories/:id", requireAdmin, a.saveCategory);
router.delete("/categories/:id", requireAdmin, a.deleteCategory);

router.get("/orders", requireAdmin, a.listOrders);
router.get("/orders/:id", requireAdmin, a.getOrder);
router.patch("/orders/:id", requireAdmin, a.updateOrder);

router.get("/payments", requireAdmin, a.listPayments);
router.get("/payments/:id/screenshot", requireAdmin, a.paymentScreenshot);
router.patch("/payments/:id", requireAdmin, a.reviewPayment);

router.get("/settings", requireAdmin, a.getSettingsAdmin);
router.put("/settings", requireAdmin, a.saveSettings);
router.post("/settings/banner-image", requireAdmin, bannerUpload.single("image"), (req, res) => {
  res.json({ url: `/uploads/banners/${req.file.filename}` });
});

router.post("/jobs/cancel-overdue", requireCronSecret, a.runCancelJob);
router.post("/jobs/cancel-overdue/run", requireAdmin, a.runCancelJob);

module.exports = router;
