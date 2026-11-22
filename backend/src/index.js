const mongoose = require("mongoose");
const env = require("./config/env");
const app = require("./app");

async function main() {
  mongoose.set("strictQuery", true);

  const port = Number(process.env.PORT) || env.port;
  app.listen(port, "0.0.0.0", () => {
    console.log(`API listening on port ${port}`);
  });

  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});