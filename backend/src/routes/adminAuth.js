const express = require('express');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const { signAdminToken, cookieOptions, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { smtpConfigured } = require('../utils/mailer');

const router = express.Router();

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 100 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid email or password' });
    const admin = await Admin.findOne({ email: req.body.email }).select('+passwordHash');
    if (!admin || !(await admin.verifyPassword(req.body.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    admin.lastLoginAt = new Date();
    await admin.save();
    const token = signAdminToken(admin);
    res.cookie('adminToken', token, cookieOptions());
    res.json({
      admin: { id: admin._id, name: admin.name, email: admin.email },
      token,
    });
  })
);

router.post(
  '/logout',
  (req, res) => {
    res.clearCookie('adminToken', { ...cookieOptions(), maxAge: 0 });
    res.json({ ok: true });
  }
);

router.get(
  '/me',
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      admin: { id: req.admin._id, name: req.admin.name, email: req.admin.email },
      smtpConfigured: smtpConfigured(),
    });
  })
);

router.post(
  '/change-password',
  requireAdmin,
  body('currentPassword').isLength({ min: 8 }),
  body('newPassword').isLength({ min: 10, max: 100 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'New password must be at least 10 characters' });
    const admin = await Admin.findById(req.admin._id).select('+passwordHash');
    if (!(await admin.verifyPassword(req.body.currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    admin.passwordHash = await Admin.hashPassword(req.body.newPassword);
    await admin.save();
    res.json({ ok: true });
  })
);

module.exports = router;
