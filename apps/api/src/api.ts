import { Hono } from "hono";
import "dotenv/config";
import type { ReadonlyJSONValue } from "@rocicorp/zero";
import { connectionProvider, PushProcessor } from "@rocicorp/zero/pg";
import { assert } from "@zero-git/auth";
import { type AuthData, AuthDataSchema } from "@zero-git/auth";
import { schema } from "@zero-git/db";
import { schema as zeroSchema } from "@zero-git/zero";
import { type } from "arktype";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
// import { nanoid } from "nanoid";
import { jwtVerify } from "jose";
import postgres from "postgres";
import { createServerMutators, type PostCommitTask } from "./server-mutators";

function getEnvOrThrow(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing environment variable: ${key}`);
	}
	return value;
}

export const api = new Hono();

const db = drizzle(getEnvOrThrow("DATABASE_URL"), { schema });
await migrate(db, { migrationsFolder: "./drizzle" });

// Store webhooks in memory
const receivedWebhooks: unknown[] = [];

// GitHub Webhook Receiver
api.post("/webhook", async (c) => {
	const payload = await c.req.json();

	receivedWebhooks.push({
		headers: Object.fromEntries(c.req.raw.headers.entries()),
		body: payload,
		timestamp: new Date().toISOString(),
	});

	return c.text("Webhook received");
});

// List all received webhooks
api.get("/webhooks", (c) => {
	return c.json(receivedWebhooks);
});

const processor = new PushProcessor(
	zeroSchema,
	connectionProvider(postgres(getEnvOrThrow("ZERO_UPSTREAM_DB"))),
);

export async function handlePush(
	authData: AuthData | undefined,
	params: Record<string, string> | URLSearchParams,
	body: ReadonlyJSONValue,
) {
	const postCommitTasks: PostCommitTask[] = [];
	const mutators = createServerMutators(authData, postCommitTasks);
	const response = await processor.process(mutators, params, body);
	await Promise.all(postCommitTasks.map((task) => task()));
	return response;
}

api.post("/push", async (c) => {
	let authorization = c.req.header("authorization");
	if (authorization !== undefined) {
		assert(authorization.toLowerCase().startsWith("bearer "));
		authorization = authorization.substring("Bearer ".length);
	}

	const jwk = process.env.VITE_PUBLIC_JWK;
	let authData: AuthData | undefined = undefined;

	if (jwk && authorization) {
		try {
			const maybeAuthData = AuthDataSchema(
				(await jwtVerify(authorization, JSON.parse(jwk))).payload,
			);
			if (maybeAuthData instanceof type.errors) {
				throw maybeAuthData;
			}
			authData = maybeAuthData;
		} catch (e) {
			if (e instanceof Error) {
				return c.text(e.message, 401);
			}
			throw e;
		}
	}

	const response = await handlePush(
		authData,
		c.req.query(),
		await c.req.json(),
	);
	return c.json(response);
});
