const express = require("express");
const rateLimit = require("express-rate-limit");
const { paymentUpload } = require("../middleware/upload");
const { requireCustomer } = require("../middleware/auth");
const c = require("../controllers/publicController");

const router = express.Router();

const orderLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many orders from this address. Please wait and try again." },
});

const lookupLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/catalog/products", c.listProducts);
router.get("/catalog/products/:slug/reviews", c.getProductReviews);
router.get("/reviews/:token", lookupLimit, c.reviewTokenValidators, c.getReviewInvitation);
router.post(
  "/reviews/:token",
  lookupLimit,
  c.reviewTokenValidators,
  c.productReviewValidators,
  c.postProductReview
);
router.get("/catalog/products/:slug", c.getProduct);
router.get("/catalog/categories", c.listCategories);
router.get("/store", c.getStore);
router.post("/checkout/quote", c.quoteValidators, c.postQuote);
router.post("/orders", orderLimit, c.orderValidators, c.postOrder);
router.get("/orders/lookup", lookupLimit, c.lookupOrder);
router.post("/orders/payment", orderLimit, paymentUpload.single("screenshot"), c.submitPayment);
router.post("/contact", lookupLimit, c.contactValidators, c.postContact);
router.post("/auth/register", authLimit, c.registerValidators, c.register);
router.post("/auth/login", authLimit, c.loginValidators, c.login);
router.post("/auth/logout", c.logout);
router.get("/auth/me", requireCustomer, c.me);
router.get("/me/orders", requireCustomer, c.myOrders);

module.exports = router;
