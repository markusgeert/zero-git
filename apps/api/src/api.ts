import { type Context, Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import "dotenv/config";
import { createClient } from "@openauthjs/openauth/client";
import type { ReadonlyJSONValue } from "@rocicorp/zero";
import { PushProcessor, connectionProvider } from "@rocicorp/zero/pg";
import { assert, subjects } from "@zero-git/auth";
import { type AuthData, AuthDataSchema } from "@zero-git/auth";
import { githubEventsTable, schema } from "@zero-git/db";
import { schema as zeroSchema } from "@zero-git/zero";
import { type } from "arktype";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { backOff } from "exponential-backoff";
// import { nanoid } from "nanoid";
import { jwtVerify } from "jose";
import postgres from "postgres";
import { type PostCommitTask, createServerMutators } from "./server-mutators";

function getEnvOrThrow(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing environment variable: ${key}`);
	}
	return value;
}

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

const db = await backOff(async () =>
	drizzle(getEnvOrThrow("DATABASE_URL"), { schema }),
);
await migrate(db, { migrationsFolder: "../../packages/db/drizzle" });

const client = createClient({
	clientID: "lambda-api",
	issuer: getEnvOrThrow("OPENAUTH_ISSUER_URL"),
});

export const api = new Hono()
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
			return c.redirect("/authorize", 302);
		}
	})
	.get("/authorize", async (c) => {
		const origin = new URL(c.req.url).origin;
		const { url } = await client.authorize(`${origin}/callback`, "code");
		return c.redirect(url, 302);
	})
	.post("/github/event", async (c) => {
		const payload = await c.req.json();

		await db.insert(githubEventsTable).values({
			id: payload.id,
			type: payload.type,
			actorId: payload.actor.id,
			repoId: payload.repo.id,
			orgId: payload.org.id,
			isPublic: payload.public,
			content: payload,
			createdAt: payload.created_at,
		});

		return c.status(200);
	})

	.post("/push", async (c) => {
		let authorization = c.req.header("authorization");
		if (authorization !== undefined) {
			assert(authorization.toLowerCase().startsWith("bearer "));
			authorization = authorization.substring("Bearer ".length);
		}

		const jwk = process.env.PUBLIC_JWK;
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
