const express = require("express");
const rateLimit = require("express-rate-limit");
const { body, param } = require("express-validator");
const { requireAdmin, requireCronSecret } = require("../middleware/auth");
const { productUpload, bannerUpload, publicUrl } = require("../middleware/upload");
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
router.post("/uploads/product", requireAdmin, productUpload.array("images", 6), a.uploadProductImages);
router.post("/products", requireAdmin, productUpload.array("images", 6), a.productValidators, a.saveProduct);
router.put("/products/:id", requireAdmin, productUpload.array("images", 6), a.productValidators, a.saveProduct);
router.delete("/products/:id", requireAdmin, a.deleteProduct);

router.get("/categories", requireAdmin, a.listCategories);
router.post("/categories", requireAdmin, a.saveCategory);
router.put("/categories/:id", requireAdmin, a.saveCategory);
router.delete("/categories/:id", requireAdmin, a.deleteCategory);

router.get("/coupons", requireAdmin, a.listCoupons);
router.post("/coupons", requireAdmin, a.saveCoupon);
router.put("/coupons/:id", requireAdmin, param("id").isMongoId(), a.saveCoupon);
router.delete("/coupons/:id", requireAdmin, param("id").isMongoId(), a.deleteCoupon);
router.get("/coupons/:id/usage",requireAdmin, a.couponUsage);

router.get("/orders", requireAdmin, a.listOrders);
router.get("/orders/:id", requireAdmin, a.getOrder);
router.patch("/orders/:id", requireAdmin, a.updateOrder);

router.get("/reviews", requireAdmin, a.listReviews);
router.patch(
  "/reviews/:id",
  requireAdmin,
  param("id").isMongoId(),
  body("status").isIn(["approved", "rejected"]),
  a.updateReview
);
router.delete("/reviews/:id", requireAdmin, param("id").isMongoId(), a.deleteReview);

router.get("/payments", requireAdmin, a.listPayments);
router.get("/payments/:id/screenshot", requireAdmin, a.paymentScreenshot);
router.patch("/payments/:id", requireAdmin, a.reviewPayment);

router.get("/settings", requireAdmin, a.getSettingsAdmin);
router.put(
  "/settings",
  requireAdmin,
  body("orderNotificationEmail")
    .trim()
    .optional({ values: "falsy" })
    .isEmail()
    .withMessage("Enter a valid order notification email address"),
  a.saveSettings
);
router.post("/settings/banner-image", requireAdmin, bannerUpload.single("image"), (req, res) => {
  res.json({ url: publicUrl("banners", req.file.filename) });
});

router.post("/jobs/cancel-overdue", requireCronSecret, a.runCancelJob);
router.post("/jobs/cancel-overdue/run", requireAdmin, a.runCancelJob);

module.exports = router;
