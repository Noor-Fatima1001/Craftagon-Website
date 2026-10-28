const mongoose = require("mongoose");
const env = require("./config/env");
const app = require("./app");
const { startScheduler } = require("./jobs/scheduler");

async function main() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");
  startScheduler();
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
