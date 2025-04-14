import { Hono } from "hono";

const app = new Hono();

// Store webhooks in memory
const receivedWebhooks: any[] = [];

// GitHub Webhook Receiver
app.post("/webhook", async (c) => {
  const payload = await c.req.json();
  receivedWebhooks.push({
    headers: Object.fromEntries(c.req.raw.headers.entries()),
    body: payload,
    timestamp: new Date().toISOString(),
  });
  return c.text("Webhook received");
});

// List all received webhooks
app.get("/webhooks", (c) => {
  return c.json(receivedWebhooks);
});

export default app;
