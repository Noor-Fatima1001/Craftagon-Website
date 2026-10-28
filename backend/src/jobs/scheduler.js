const cron = require("node-cron");
const env = require("../config/env");
const { cancelOverdueOrders } = require("../services/cancelService");

function startScheduler() {
  if (!env.enableInternalCron) {
    console.log("Internal cancel job disabled (ENABLE_INTERNAL_CRON=false). Use host cron + npm run job:cancel-overdue.");
    return;
  }
  cron.schedule("*/15 * * * *", async () => {
    try {
      const result = await cancelOverdueOrders();
      if (result.cancelled) console.log(`Auto-cancelled ${result.cancelled} overdue order(s)`);
    } catch (err) {
      console.error("Cancel job failed", err.message);
    }
  });
  console.log("Internal cancel job scheduled every 15 minutes");
}

module.exports = { startScheduler };
