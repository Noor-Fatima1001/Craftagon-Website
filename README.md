# Craftagon

Customized-products store (pens, mugs, tumblers, diaries, notebooks, gifts) with a React storefront and an Express admin dashboard. Customers enter print text only (no image uploads). Advance payment is **manual** (bank / Easypaisa / JazzCash). WhatsApp is **click-to-chat only**. There is **no payment gateway** and **no WhatsApp Business API**.

Domain, hosting, email, and file storage are **not free**. This project does not include those purchases.

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router (`frontend/`)
- Backend: Node.js, Express, MongoDB, Mongoose (`backend/`)
- Local disk uploads (product images, banners, payment screenshots)

## Requirements

- Node.js 18+
- MongoDB (local or Atlas). Atlas and some hosts bill after free-tier limits.

## Setup

```bash
# 1. Backend
cd backend
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
# Edit .env: MONGODB_URI, JWT_SECRET, CRON_SECRET, WHATSAPP_NUMBER placeholder
npm install
npm run create-admin -- --email admin@example.com --password "choose-a-long-password" --name "Admin"
npm run seed
npm run dev

# 2. Frontend (new terminal)
cd frontend
copy .env.example .env
npm install
npm run dev
```

Storefront: http://localhost:5173  
Admin: http://localhost:5173/admin/login

There is **no public admin registration**. Create admins only with `create-admin`.

## Environment variables

See `backend/.env.example` and `frontend/.env.example`. Never commit real secrets.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Admin session signing key |
| `FRONTEND_URL` | Allowed CORS origin |
| `CRON_SECRET` | Protects the optional HTTP cancellation endpoint |
| `WHATSAPP_NUMBER` | Default click-to-chat number (placeholder such as `923000000000`) |
| `SMTP_*` | Optional email. If empty, the shop still runs |
| `VITE_API_URL` | Empty in local dev (Vite proxy). In production, public API origin |

Change the WhatsApp number in **Admin → Settings** as well.

## Email

Uses Nodemailer and your SMTP host (for example a free-tier provider). Free tiers have daily/hourly send limits and can suspend accounts. If SMTP is missing, orders still succeed; the admin dashboard shows SMTP status. The app **does not claim an email was sent** when sending failed.

Templates: order confirmation + advance instructions, payment verified/rejected, cancellation, dispatch with tracking.

## WhatsApp

Buttons open `https://wa.me/<number>?text=...` with a prefilled message (order number, advance amount, payment instructions). **The customer or admin must press Send.** Nothing is sent automatically. Do not add a paid WhatsApp API.

## Manual payments

1. Customer places an order and sees account details from admin settings.
2. Customer transfers the **advance** and uploads a screenshot plus transaction ID.
3. Status becomes **Under Review**.
4. Admin compares the screenshot/reference with the **actual received transaction**, then marks **Verified** or **Rejected**. Screenshots never auto-verify.

Statuses: Pending → Under Review → Verified | Rejected.

## Cancellation job

Unpaid orders past `paymentDeadlineHours` are cancelled if:

- payment is not **Verified**
- payment is not **Under Review**
- order is not already cancelled, dispatched, delivered, confirmed, or processing

Stock is restored. A cancellation email is sent only if SMTP works and one was not already sent.

The API process runs this every 15 minutes via `node-cron` (works on a long-running VPS/Node host).

Also:

```bash
cd backend
npm run cancel-overdue
```

Or an external cron (host crontab, not a paid scheduler) hitting:

```http
POST /api/internal/cancel-overdue
Header: x-cron-secret: <CRON_SECRET>
```

On serverless hosts, `node-cron` inside the request process is unreliable; use the HTTP endpoint from the host’s native cron.

Cancellation WhatsApp is **not** automatic. Use the WhatsApp button on the order screen.

## Image storage

Files live in `backend/uploads/`. Product and banner images are public. Payment proofs are served only to authenticated admins (`/api/admin/payment-file/:filename`).

Local disk is fine for development. Production object storage (S3, etc.) usually **costs money** after free tiers. Set upload size with `UPLOAD_MAX_MB` (default 2). Allowed types: JPEG, PNG, WebP.

## Deployment notes

1. Buy a domain and hosting separately.
2. Set `NODE_ENV=production`, `COOKIE_SECURE=true` (HTTPS), strong `JWT_SECRET` and `CRON_SECRET`.
3. Point `FRONTEND_URL` at the real shop origin.
4. Build frontend: `cd frontend && npm run build` and serve `dist/` (or any static host).
5. Run backend with a process manager (`node src/server.js` or systemd). Keep MongoDB backups (mongodump) on a schedule; storage may be billed.
6. Put a reverse proxy in front (nginx/Caddy) with HTTPS.

## Security

- Admin passwords hashed with bcrypt (cost 12)
- HttpOnly session cookie + optional Bearer token
- Helmet, CORS allowlist, rate limits, mongo sanitization, request validation
- Order lookup requires `orderNumber` **and** a secret `token` (not guessable from the order number alone)
- Audit log for payment verification, cancellation, product/settings changes
- Do not expose `.env`, payment proofs, or customer exports publicly

## Main customer flow

Browse → enter custom text → live 2D preview → cart (same product + different text stays separate) → checkout → thank-you page with order number, totals snapshot, payment instructions, WhatsApp button → upload proof → admin verifies → dispatch with courier/tracking.

## Scripts

```bash
# backend
npm run dev
npm start
npm run seed
npm run create-admin -- --email ... --password ...
npm run cancel-overdue

# frontend
npm run dev
npm run build
```
