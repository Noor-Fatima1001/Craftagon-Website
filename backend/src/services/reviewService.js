const crypto = require("crypto");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const ProductReview = require("../models/ProductReview");
const ReviewRequest = require("../models/ReviewRequest");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const emailService = require("./emailService");

const INVITE_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const SENDING_LEASE_MS = 30 * 60 * 1000;

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createReviewRequests(order) {
  const uniqueItems = new Map();
  for (const item of order.items || []) {
    if (item.product) uniqueItems.set(String(item.product), item);
  }

  for (const [productId, item] of uniqueItems) {
    const token = createToken();
    try {
      await ReviewRequest.create({
        order: order._id,
        orderNumber: order.orderNumber,
        product: productId,
        productName: item.name || "Purchased product",
        productSlug: item.slug || productId,
        productImage: item.image || "",
        customerEmail: order.customer.email,
        customerName: order.customer.fullName,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + INVITE_LIFETIME_MS),
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
}

async function sendRequest(requestId) {
  const token = createToken();
  const staleSendingBefore = new Date(Date.now() - SENDING_LEASE_MS);
  const claimed = await ReviewRequest.findOneAndUpdate(
    {
      _id: requestId,
      $or: [
        { emailStatus: { $in: ["pending", "failed"] } },
        { emailStatus: "sending", sendingStartedAt: { $lt: staleSendingBefore } },
      ],
    },
    {
      $set: {
        emailStatus: "sending",
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + INVITE_LIFETIME_MS),
        sendingStartedAt: new Date(),
        emailError: "",
      },
    },
    { new: true }
  );
  if (!claimed) return { sent: false, skipped: true };

  const link = `${env.frontendUrl.replace(/\/$/, "")}/review/${token}`;
  const productLink = `${env.frontendUrl.replace(/\/$/, "")}/products/${encodeURIComponent(claimed.productSlug)}`;
  const result = await emailService.reviewRequest(claimed, link, productLink);
  if (result.sent) {
    await ReviewRequest.updateOne(
      { _id: claimed._id, emailStatus: "sending" },
      { $set: { emailStatus: "sent", emailSentAt: new Date(), emailError: "" } }
    );
    return { sent: true };
  }

  await ReviewRequest.updateOne(
    { _id: claimed._id, emailStatus: "sending" },
    { $set: { emailStatus: "failed", emailError: result.reason || "Email could not be sent" } }
  );
  console.error(`Review request email failed for order ${claimed.order}: ${result.reason || "unknown error"}`);
  return { sent: false, reason: result.reason || "Email could not be sent" };
}

async function sendReviewRequestsForOrder(order) {
  if (!order?.deliveredAt || !["delivered", "completed"].includes(order.status)) {
    throw new AppError("Review requests require a successfully delivered order", 409);
  }
  await createReviewRequests(order);
  const requests = await ReviewRequest.find({ order: order._id });
  const results = await Promise.all(requests.map((request) => sendRequest(request._id)));
  return {
    sent: results.filter((result) => result.sent).length,
    failed: results.filter((result) => !result.sent && !result.skipped).length,
  };
}

async function processReviewRequestQueue() {
  const staleSendingBefore = new Date(Date.now() - SENDING_LEASE_MS);
  const requests = await ReviewRequest.find({
    $or: [
      { emailStatus: { $in: ["pending", "failed"] } },
      { emailStatus: "sending", sendingStartedAt: { $lt: staleSendingBefore } },
    ],
  })
    .sort({ updatedAt: 1 })
    .limit(100)
    .select("_id");
  let sent = 0;
  for (const request of requests) {
    const result = await sendRequest(request._id);
    if (result.sent) sent += 1;
  }
  return { sent, attempted: requests.length };
}

async function getReviewRequest(token) {
  const request = await ReviewRequest.findOne({
    tokenHash: hashToken(token),
    emailStatus: "sent",
  });
  if (!request || request.expiresAt <= new Date()) {
    throw new AppError("This review link is invalid or has expired", 404);
  }
  if (request.consumedAt) throw new AppError("A review has already been submitted for this order and product", 409);

  const order = await Order.findById(request.order).select("orderNumber status deliveredAt");
  if (!order || !["delivered", "completed"].includes(order.status) || !order.deliveredAt) {
    throw new AppError("Reviews are available only after successful delivery", 403);
  }
  const existingReview = await ProductReview.exists({ order: request.order, product: request.product });
  if (existingReview) throw new AppError("A review has already been submitted for this order and product", 409);

  return {
    orderNumber: order.orderNumber,
    product: {
      name: request.productName,
      slug: request.productSlug,
      image: request.productImage,
    },
  };
}

async function submitReview(token, { rating, title, comment }) {
  const request = await ReviewRequest.findOne({
    tokenHash: hashToken(token),
    emailStatus: "sent",
  });
  if (!request || request.expiresAt <= new Date()) {
    throw new AppError("This review link is invalid or has expired", 404);
  }
  if (request.consumedAt) throw new AppError("A review has already been submitted for this order and product", 409);

  const order = await Order.findById(request.order).select("status deliveredAt items");
  if (
    !order ||
    !["delivered", "completed"].includes(order.status) ||
    !order.deliveredAt ||
    !order.items.some((item) => String(item.product) === String(request.product))
  ) {
    throw new AppError("A successfully delivered order containing this product is required", 403);
  }

  const customer = await Customer.findOne({ email: request.customerEmail }).select("_id");
  try {
    const review = await ProductReview.create({
      product: request.product,
      order: request.order,
      customer: customer?._id,
      customerName: request.customerName,
      rating,
      title,
      comment,
      verifiedPurchase: true,
      status: "pending",
    });
    await ReviewRequest.updateOne(
      { _id: request._id, consumedAt: { $exists: false } },
      { $set: { consumedAt: new Date() } }
    );
    return review;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError("A review has already been submitted for this order and product", 409);
    }
    throw error;
  }
}

module.exports = {
  getReviewRequest,
  processReviewRequestQueue,
  sendReviewRequestsForOrder,
  submitReview,
};
