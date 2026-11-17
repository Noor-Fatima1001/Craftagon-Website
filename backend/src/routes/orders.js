const express = require('express');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/error');
const { paymentUpload, publicUrl } = require('../middleware/upload');
const { createOrder, findPublicOrder, publicOrder } = require('../services/orderService');
const { submitPayment } = require('../services/paymentService');
const { getSettings } = require('../services/settingsService');
const { whatsappLink, orderWhatsAppMessage } = require('../utils/whatsapp');
const PaymentSubmission = require('../models/PaymentSubmission');

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

router.post(
  '/',
  body('fullName').trim().isLength({ min: 2, max: 120 }),
  body('phone').trim().isLength({ min: 10, max: 20 }),
  body('email').isEmail().normalizeEmail(),
  body('province').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('address').trim().isLength({ min: 8, max: 300 }),
  body('items').isArray({ min: 1 }),
  body('idempotencyKey').isLength({ min: 8, max: 80 }),
  validate,
  asyncHandler(async (req, res) => {
    const { order, duplicate, email } = await createOrder(req.body);
    const settings = await getSettings();
    const token = order.lookupToken;
    res.status(duplicate ? 200 : 201).json({
      order: publicOrder(order, token),
      duplicate,
      emailSent: Boolean(email?.sent),
      emailReason: email?.reason,
      whatsappUrl: whatsappLink(settings.whatsappNumber, orderWhatsAppMessage(order, settings)),
    });
  })
);

router.get(
  '/:orderNumber',
  asyncHandler(async (req, res) => {
    const order = await findPublicOrder(req.params.orderNumber, req.query.token);
    const settings = await getSettings();
    const submissions = await PaymentSubmission.find({ order: order._id })
      .select('status method transactionRef createdAt amountClaimed')
      .sort({ createdAt: -1 });
    res.json({
      order: publicOrder(order),
      payments: submissions,
      whatsappUrl: whatsappLink(settings.whatsappNumber, orderWhatsAppMessage(order, settings)),
    });
  })
);

router.post(
  '/:orderNumber/payment',
  paymentUpload.single('screenshot'),
  body('transactionRef').trim().isLength({ min: 4, max: 80 }),
  validate,
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Payment screenshot is required' });
    const order = await findPublicOrder(req.params.orderNumber, req.body.token || req.query.token);
    const screenshotPath = publicUrl('payments', req.file.filename);
    try {
      const submission = await submitPayment({
        order,
        method: req.body.method,
        transactionRef: req.body.transactionRef,
        screenshotPath,
        amountClaimed: req.body.amountClaimed,
      });
      res.status(201).json({
        message: 'Payment proof received and is under review. Verification is manual and not automatic.',
        payment: {
          id: submission._id,
          status: submission.status,
          transactionRef: submission.transactionRef,
          createdAt: submission.createdAt,
        },
      });
    } catch (err) {
      if (!/^https?:\/\//i.test(screenshotPath)) {
        fs.unlink(path.join(__dirname, '../../uploads/payments', req.file.filename), () => {});
      }
      throw err;
    }
  })
);

module.exports = router;
