require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { connectDb } = require('../config/db');
const Admin = require('../models/Admin');

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return '';
  return process.argv[idx + 1] || '';
}

async function run() {
  const email = (arg('email') || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = arg('password') || process.env.ADMIN_PASSWORD || '';
  const name = arg('name') || 'Store Admin';
  if (!email || !password) {
    console.error('Usage: npm run create-admin -- --email admin@example.com --password "a-long-password" --name "Admin"');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error('Password must be at least 10 characters');
    process.exit(1);
  }
  await connectDb();
  const existing = await Admin.findOne({ email });
  if (existing) {
    console.error('An admin with this email already exists');
    process.exit(1);
  }
  const passwordHash = await Admin.hashPassword(password);
  await Admin.create({ name, email, passwordHash });
  console.log(`Admin created: ${email}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
