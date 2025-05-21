import { type Context, Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import "dotenv/config";
import { Webhooks } from "@octokit/webhooks";
import type { WebhookEvent, WebhookEventName } from "@octokit/webhooks-types";
import { createClient } from "@openauthjs/openauth/client";
import type { ReadonlyJSONValue } from "@rocicorp/zero";
import {
	PostgresJSConnection,
	PushProcessor,
	ZQLDatabase,
} from "@rocicorp/zero/pg";
import { assert, subjects } from "@zero-git/auth";
import { type AuthData, AuthDataSchema } from "@zero-git/auth";
import { githubEventsTable, schema } from "@zero-git/db";
import { schema as zeroSchema } from "@zero-git/zero";
import { type } from "arktype";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { backOff } from "exponential-backoff";
import { jwtVerify } from "jose";
import postgres from "postgres";
import { getEnvOrThrow } from "./get-env.js";
import { handleEvent } from "./github-events.js";
import { createServerMutators } from "./server-mutators.js";

const webhooks = new Webhooks({
	secret: getEnvOrThrow("GITHUB_WEBHOOK_SECRET"),
});

function getOrgId(payload: WebhookEvent) {
	if ("repository" in payload) {
		return payload.repository?.owner.id;
	}

	if ("organization" in payload) {
		return payload.organization?.id;
	}

	if ("sender" in payload) {
		return payload.sender?.id;
	}

	if ("account" in payload) {
		return payload.account?.id;
	}

	if ("security_advisory" in payload || "zen" in payload) {
		return;
	}

	payload satisfies never;

	throw new Error("Unknown event");
}

function getRepoId(payload: WebhookEvent) {
	if ("repository" in payload) {
		return payload.repository?.id;
	}
}

const processor = new PushProcessor(
	new ZQLDatabase(
		new PostgresJSConnection(postgres(getEnvOrThrow("ZERO_UPSTREAM_DB"))),
		zeroSchema,
	),
);
export async function handlePush(
	authData: AuthData | undefined,
	params: Record<string, string> | URLSearchParams,
	body: ReadonlyJSONValue,
) {
	const mutators = createServerMutators(authData);
	const response = await processor.process(mutators, params, body);
	return response;
}

const db = await backOff(async () =>
	drizzle(getEnvOrThrow("DATABASE_URL"), { schema }),
);
await migrate(db, { migrationsFolder: "../../packages/db/drizzle" });

const client = createClient({
	clientID: "lambda-api",
	issuer: getEnvOrThrow("OPENAUTH_ISSUER_URL"),
});

async function getJwk() {
	return fetch(`${getEnvOrThrow("OPENAUTH_ISSUER_URL")}/.well-known/jwks.json`)
		.then((res) => res.json())
		.then((data) => data.keys.pop());
}

let jwk: unknown | undefined = undefined;

export const api = new Hono()
	.get("/health", async (c) => {
		return c.json({ status: "ok" });
	})
	.get("/", async (c) => {
		const access = getCookie(c, "access_token");
		const refresh = getCookie(c, "refresh_token");
		try {
			const verified = await client.verify(subjects, access as string, {
				refresh,
			});
			if (verified.err) throw new Error("Invalid access token");
			if (verified.tokens)
				setSession(c, verified.tokens.access, verified.tokens.refresh);
			return c.json(verified.subject);
		} catch (e) {
			console.error(e);
			return c.redirect("/api/v1/authorize", 302);
		}
	})
	.get("/authorize", async (c) => {
		const origin = new URL(c.req.url).origin;
		const { url } = await client.authorize(`${origin}/callback`, "code");
		return c.redirect(url, 302);
	})
	.post("/github/event", async (c) => {
		const signature = c.req.header("x-hub-signature-256");
		assert(signature);

		const body = await c.req.text();
		if (!(await webhooks.verify(body, signature))) {
			c.status(401);
			return c.text("Unauthorized");
		}

		const payload: WebhookEvent = await c.req.json();

		const id = c.req.header("X-GitHub-Delivery");
		assert(id);

		const type = c.req.header("X-GitHub-Event") as WebhookEventName | undefined;
		assert(type);

		const orgId = getOrgId(payload);
		const repoId = getRepoId(payload);

		await db.insert(githubEventsTable).values({
			id,
			type,
			orgId: orgId?.toString(),
			repoId: repoId?.toString(),
			content: payload,
			createdAt: new Date(),
		});

		await handleEvent(type, payload, db);

		return c.status(200);
	})

	.post("/push", async (c) => {
		let authorization = c.req.header("authorization");
		if (authorization !== undefined) {
			assert(authorization.toLowerCase().startsWith("bearer "));
			authorization = authorization.substring("Bearer ".length);
		}

		jwk ??= await getJwk();
		let authData: AuthData | undefined = undefined;

		if (jwk && authorization) {
			try {
				const maybeAuthData = AuthDataSchema(
					(await jwtVerify(authorization, jwk)).payload,
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

function setSession(c: Context, accessToken?: string, refreshToken?: string) {
	if (accessToken) {
		setCookie(c, "access_token", accessToken, {
			httpOnly: true,
			sameSite: "Strict",
			path: "/",
			maxAge: 34560000,
		});
	}
	if (refreshToken) {
		setCookie(c, "refresh_token", refreshToken, {
			httpOnly: true,
			sameSite: "Strict",
			path: "/",
			maxAge: 34560000,
		});
	}
}
