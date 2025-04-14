import { Hono } from "hono";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { usersTable } from "./db/schema";
import { nanoid } from "nanoid";

const app = new Hono();

const db = drizzle(process.env.DATABASE_URL!);
await migrate(db, { migrationsFolder: "./drizzle" });

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
