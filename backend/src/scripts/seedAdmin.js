const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const env = require("../config/env");
const Admin = require("../models/Admin");

async function run() {
  if (!env.adminEmail || !env.adminPassword) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env");
  }
  if (env.adminPassword.length < 10) {
    throw new Error("ADMIN_PASSWORD must be at least 10 characters");
  }
  await mongoose.connect(env.mongoUri);
  const passwordHash = await bcrypt.hash(env.adminPassword, 12);
  const admin = await Admin.findOneAndUpdate(
    { email: env.adminEmail.toLowerCase() },
    { name: env.adminName, email: env.adminEmail.toLowerCase(), passwordHash },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Admin ready: ${admin.email}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
