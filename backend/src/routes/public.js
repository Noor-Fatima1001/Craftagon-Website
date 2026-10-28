const express = require("express");
const rateLimit = require("express-rate-limit");
const { paymentUpload } = require("../middleware/upload");
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

router.get("/catalog/products", c.listProducts);
router.get("/catalog/products/:slug", c.getProduct);
router.get("/catalog/categories", c.listCategories);
router.get("/store", c.getStore);
router.post("/checkout/quote", c.quoteValidators, c.postQuote);
router.post("/orders", orderLimit, c.orderValidators, c.postOrder);
router.get("/orders/lookup", lookupLimit, c.lookupOrder);
router.post("/orders/payment", orderLimit, paymentUpload.single("screenshot"), c.submitPayment);

module.exports = router;
