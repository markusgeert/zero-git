import { type Context, Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import "dotenv/config";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { Webhooks } from "@octokit/webhooks";
import type {
	Repository,
	WebhookEvent,
	WebhookEventMap,
	WebhookEventName,
} from "@octokit/webhooks-types";
import { createClient } from "@openauthjs/openauth/client";
import type { ReadonlyJSONValue } from "@rocicorp/zero";
import {
	PostgresJSConnection,
	PushProcessor,
	ZQLDatabase,
} from "@rocicorp/zero/pg";
import { assert, subjects } from "@zero-git/auth";
import { type AuthData, AuthDataSchema } from "@zero-git/auth";
import {
	githubEventsTable,
	githubUsersTable,
	issuesTable,
	pullRequestsTable,
	reposTable,
	schema,
} from "@zero-git/db";
import { schema as zeroSchema } from "@zero-git/zero";
import { type } from "arktype";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { backOff } from "exponential-backoff";
import { jwtVerify } from "jose";
import postgres from "postgres";
import { createServerMutators } from "./server-mutators.js";

const webhooks = new Webhooks({
	secret: getEnvOrThrow("GITHUB_WEBHOOK_SECRET"),
});

function getEnvOrThrow(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing environment variable: ${key}`);
	}
	return value;
}

// Helper type to extract the 'action' literal type from an object with an optional 'action' property
type ActionLiteral<T> = T extends { action: infer A } ? A : never;

// Helper type to get all possible action literals for a given WebhookEvent type
type PossibleActions<T extends WebhookEvent> = ActionLiteral<T>;

// Helper type to generate the combined keys (event or event.action)
type GenerateEventKeys = {
	[K in WebhookEventName]:
		| K // Event name itself
		| (PossibleActions<WebhookEventMap[K]> extends never
				? never // No actions for this event type
				: `${K}.${PossibleActions<WebhookEventMap[K]>}`); // Event.action for each possible action
}[WebhookEventName]; // Get the union of all generated keys

// Define the refined EventKey type
type EventKey = GenerateEventKeys;

// Define a type for the event handlers
type EventHandler<T extends WebhookEvent> = (
	payload: T,
) => Promise<void> | void;

// Define the type for our eventHandlers map
type EventHandlers = {
	[K in EventKey]?: K extends WebhookEventName
		? EventHandler<WebhookEventMap[K]> // Handler for a general event type
		: K extends `${infer Type}.${infer Action}`
			? Type extends WebhookEventName
				? Action extends string
					? EventHandler<
							Extract<
								WebhookEventMap[Type],
								{ action: Action } | { action?: never } // Try to narrow by action
							>
						>
					: never
				: never
			: never;
};

const eventHandlers: EventHandlers = {
	"installation.created": async (p) => {
		const buffer = Buffer.from(getEnvOrThrow("GITHUB_PRIVATE_KEY"), "base64");
		const githubPrivateKey = buffer.toString("utf8");

		const octokit = new Octokit({
			authStrategy: createAppAuth,
			auth: {
				appId: getEnvOrThrow("GITHUB_APP_ID"),
				privateKey: githubPrivateKey,
				installationId: p.installation.id,
			},
		});

		await Promise.all([
			db
				.insert(githubUsersTable)
				.values({
					id: p.installation.account.id.toString(),
					githubId: p.installation.account.id.toString(),
					name: p.installation.account.login,
					avatarUrl: p.installation.account.avatar_url,
					type: p.installation.account.type,
				})
				.onConflictDoUpdate({
					target: githubUsersTable.id,
					set: {
						name: p.installation.account.login,
						avatarUrl: p.installation.account.avatar_url,
					},
				}),
			...(p.repositories?.map(async (repoMeta) => {
				const { data } = await octokit.rest.repos.get({
					owner: p.installation.account.login,
					repo: repoMeta.name,
				});

				const repo = data as Repository;

				return await db
					.insert(reposTable)
					.values({
						id: repo.id.toString(),
						githubId: repo.id.toString(),
						orgId: repo.owner.id.toString(),
						name: repo.name,
						fork: repo.fork,
						stars: repo.stargazers_count,
						description: repo.description,
						visibility: repo.visibility as
							| "public"
							| "private"
							| "internal"
							| undefined,
						content: repo,
						createdAt: new Date(repo.created_at),
						modifiedAt: new Date(repo.updated_at),
					})
					.onConflictDoUpdate({
						target: reposTable.id,
						set: {
							name: repo.name,
							orgId: repo.owner.id.toString(),
							visibility: repo.visibility,
							fork: repo.fork,
							stars: repo.stargazers_count,
							content: repo,
							description: repo.description,
							modifiedAt: new Date(repo.updated_at),
						},
					});
			}) ?? []),
		]);
	},
	repository: async (p) => {
		const repo = p.repository;

		await db
			.insert(reposTable)
			.values({
				id: repo.id.toString(),
				githubId: repo.id.toString(),
				orgId: repo.owner.id.toString(),
				name: repo.name,
				fork: repo.fork,
				stars: repo.stargazers_count,
				description: repo.description,
				visibility: repo.visibility,
				content: repo,
				createdAt: new Date(repo.created_at),
				modifiedAt: new Date(repo.updated_at),
			})
			.onConflictDoUpdate({
				target: reposTable.id,
				set: {
					name: repo.name,
					orgId: repo.owner.id.toString(),
					visibility: repo.visibility,
					fork: repo.fork,
					stars: repo.stargazers_count,
					content: repo,
					description: repo.description,
					modifiedAt: new Date(repo.updated_at),
				},
			});
	},
	issues: async (p) => {
		const repository = p.repository;
		const issue = p.issue;

		await db
			.insert(issuesTable)
			.values({
				id: issue.id.toString(),
				githubId: issue.id.toString(),
				orgId: repository.owner.id.toString(),
				repoId: repository.id.toString(),
				title: issue.title,
				number: issue.number,
				state: issue.state,
				locked: issue.locked,
				body: issue.body,
				content: issue,
				createdAt: new Date(issue.created_at),
				modifiedAt: new Date(issue.updated_at),
			})
			.onConflictDoUpdate({
				target: issuesTable.id,
				set: {
					title: issue.title,
					state: issue.state,
					locked: issue.locked,
					body: issue.body,
					content: issue,
					modifiedAt: new Date(issue.updated_at),
				},
			});
	},
	pull_request: async (p) => {
		const pr = p.pull_request;

		await db
			.insert(pullRequestsTable)
			.values({
				id: pr.id.toString(),
				githubId: pr.id.toString(),
				ownerId: pr.base.repo.owner.id.toString(),
				repoId: pr.base.repo.id.toString(),
				creatorId: p.sender.id.toString(),
				title: pr.title,
				number: pr.number,
				state: pr.state,
				locked: pr.locked,
				body: pr.body,
				content: pr,
				createdAt: new Date(pr.created_at),
				modifiedAt: new Date(pr.updated_at),
			})
			.onConflictDoUpdate({
				target: pullRequestsTable.id,
				set: {
					title: pr.title,
					state: pr.state,
					locked: pr.locked,
					body: pr.body,
					content: pr,
					modifiedAt: new Date(pr.updated_at),
				},
			});
	},
};

async function handleEvent(type: WebhookEventName, payload: WebhookEvent) {
	if ("action" in payload) {
		const action = payload.action;
		const specificKey = `${type}.${action}` as EventKey;

		const specificHandler = eventHandlers[specificKey];
		if (specificHandler) {
			// @ts-expect-error: too complex for typescript
			// biome-ignore lint/suspicious/noExplicitAny: This is a workaround for the type system
			await specificHandler(payload as any);
			return;
		}
	}

	const generalHandler = eventHandlers[type];
	if (generalHandler) {
		// @ts-expect-error: too complex for typescript
		// biome-ignore lint/suspicious/noExplicitAny: This is a workaround for the type system
		await generalHandler(payload as any);
		return;
	}

	console.warn(`No handler found for ${type}`);
}

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

		await handleEvent(type, payload);

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
				console.log(e, authorization, jwk);
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
