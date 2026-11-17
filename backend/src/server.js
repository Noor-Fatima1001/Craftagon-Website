require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cron = require('node-cron');
const { connectDb } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');
const { requireAdmin, requireCronSecret } = require('./middleware/auth');
const { cancelOverdueOrders } = require('./jobs/cancelOverdue');
const { getSettings } = require('./services/settingsService');
const { processReviewRequestQueue } = require('./services/reviewService');
const { retryFailedOrderStatusNotifications } = require('./services/orderNotificationService');

const publicRoutes = require('./routes/public');
const orderRoutes = require('./routes/orders');
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''));

app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: frontendOrigins,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

const generalLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const orderLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

app.use('/api', generalLimit);

const uploadsDir = path.join(__dirname, '../uploads');
['products', 'banners', 'payments'].forEach((dir) => {
  try {
    fs.mkdirSync(path.join(uploadsDir, dir), { recursive: true });
  } catch (err) {
    console.warn(`Could not create uploads/${dir}:`, err.message);
  }
});

app.use('/uploads/products', express.static(path.join(uploadsDir, 'products')));
app.use('/uploads/banners', express.static(path.join(uploadsDir, 'banners')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authLimit, adminAuthRoutes);
app.use('/api', publicRoutes);
app.use('/api/orders', orderLimit, orderRoutes);
app.use('/api/admin', requireAdmin, adminRoutes);

app.post('/api/internal/cancel-overdue', requireCronSecret, async (req, res, next) => {
  try {
    const result = await cancelOverdueOrders();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDb();
  await getSettings();
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await cancelOverdueOrders();
      if (result.cancelled) console.log('Auto-cancel job:', result);
    } catch (err) {
      console.error('Auto-cancel job failed:', err.message);
    }
    try {
      const result = await retryFailedOrderStatusNotifications();
      if (result.sent) console.log(`Sent ${result.sent} failed order status email(s)`);
    } catch (err) {
      console.error('Order status email retry job failed:', err.message);
    }
    try {
      const result = await processReviewRequestQueue();
      if (result.sent) console.log(`Sent ${result.sent} queued review request email(s)`);
    } catch (err) {
      console.error('Review request queue job failed:', err.message);
    }
  });
  app.listen(PORT, () => console.log(`API listening on ${PORT}`));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
