const mongoose = require("mongoose");
const env = require("../config/env");
const { cancelOverdueOrders } = require("../services/cancelService");

async function run() {
  await mongoose.connect(env.mongoUri);
  const result = await cancelOverdueOrders();
  console.log(JSON.stringify(result));
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
