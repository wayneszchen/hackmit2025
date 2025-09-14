const express = require("express");
const app = express();

app.use(express.json({ type: "application/json" }));

app.post("/webhooks/knot", async (req, res) => {
  console.log("🔔 Webhook received:", JSON.stringify(req.body, null, 2));
  
  // Log the specific event type and details
  if (req.body.event === "NEW_TRANSACTIONS_AVAILABLE") {
    console.log(`📊 New transactions available for user: ${req.body.external_user_id}`);
    console.log(`🏪 Merchant: ${req.body.merchant?.name} (ID: ${req.body.merchant?.id})`);
    console.log("💡 Next step: Run the transaction sync script with these details");
  }
  
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Knot webhook server is running! POST to /webhooks/knot");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server listening on http://localhost:${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhooks/knot`);
  console.log("💡 Don't forget to expose this with ngrok for external access!");
});
