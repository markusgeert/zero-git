import { createAppAuth } from "@octokit/auth-app";
import { Octokit, type RestEndpointMethodTypes } from "@octokit/rest";
import type {
	Installation,
	Issue,
	PullRequest,
	Repository,
	WebhookEvent,
	WebhookEventMap,
	WebhookEventName,
} from "@octokit/webhooks-types";
import {
	githubUsersTable,
	issuesTable,
	pullRequestsTable,
	reposTable,
	type schema,
} from "@zero-git/db";
import { type InferInsertModel, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { getEnvOrThrow } from "./get-env";

type DBType = NodePgDatabase<typeof schema>;

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
	db: DBType,
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

async function upsertUserFromInstallation(
	installation: Installation,
	db: DBType,
) {
	return db
		.insert(githubUsersTable)
		.values({
			id: installation.account.id.toString(),
			githubId: installation.account.id.toString(),
			name: installation.account.login,
			avatarUrl: installation.account.avatar_url,
			type: installation.account.type,
		})
		.onConflictDoUpdate({
			target: githubUsersTable.id,
			set: {
				name: installation.account.login,
				avatarUrl: installation.account.avatar_url,
				type: installation.account.type,
			},
		});
}

async function upsertRepo(repo: Repository, db: DBType) {
	return db
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
}

type PR =
	| RestEndpointMethodTypes["pulls"]["list"]["response"]["data"][number]
	| PullRequest;

function mapPR(pr: PR): InferInsertModel<typeof pullRequestsTable> {
	return {
		id: pr.id.toString(),
		githubId: pr.id.toString(),
		ownerId: pr.base.repo.owner.id.toString(),
		repoId: pr.base.repo.id.toString(),
		creatorId: pr.user?.id.toString() ?? "",
		title: pr.title,
		number: pr.number,
		state: pr.state,
		locked: pr.locked,
		body: pr.body,
		content: pr,
		createdAt: new Date(pr.created_at),
		modifiedAt: new Date(pr.updated_at),
	};
}

async function upsertPr(pr: PullRequest, db: DBType) {
	await db
		.insert(pullRequestsTable)
		.values(mapPR(pr))
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
}

async function upsertPulls(
	pulls: InferInsertModel<typeof pullRequestsTable>[],
	db: DBType,
) {
	if (pulls.length === 0) {
		return;
	}

	return db
		.insert(pullRequestsTable)
		.values(pulls)
		.onConflictDoUpdate({
			target: pullRequestsTable.id,
			set: {
				title: sql.raw(`excluded.${pullRequestsTable.title.name}`),
				state: sql.raw(`excluded.${pullRequestsTable.state.name}`),
				locked: sql.raw(`excluded.${pullRequestsTable.locked.name}`),
				body: sql.raw(`excluded.${pullRequestsTable.body.name}`),
				content: sql.raw(`excluded.${pullRequestsTable.content.name}`),
				modifiedAt: sql.raw(`excluded.${pullRequestsTable.modifiedAt.name}`),
			},
		});
}

async function upsertIssue(issue: Issue, repository: Repository, db: DBType) {
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
}

const eventHandlers: EventHandlers = {
	"installation.created": async (p, db) => {
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

		const reposToFetch = p.repositories
			? p.repositories.map((repoMeta) =>
					octokit.rest.repos
						.get({
							owner: p.installation.account.login,
							repo: repoMeta.name,
						})
						.then(async ({ data: repo }) => {
							const { data: pulls } = await octokit.rest.pulls.list({
								owner: p.installation.account.login,
								repo: repoMeta.name,
							});

							return Promise.allSettled([
								upsertRepo(repo as Repository, db),
								upsertPulls(pulls.map(mapPR), db),
							]);
						}),
				)
			: [];

		const promisesToResolve = [
			upsertUserFromInstallation(p.installation, db),
			...reposToFetch,
		] satisfies Promise<unknown>[];

		await Promise.allSettled(promisesToResolve);
	},
	repository: async (p, db) => {
		const repo = p.repository;
		await upsertRepo(repo, db);
	},
	issues: async (p, db) => {
		const repository = p.repository;
		const issue = p.issue;

		await upsertIssue(issue, repository, db);
	},
	pull_request: async (p, db) => {
		const pr = p.pull_request;

		await upsertPr(pr, db);
	},
};

export async function handleEvent(
	type: WebhookEventName,
	payload: WebhookEvent,
	db: DBType,
) {
	let action: string | undefined;
	if ("action" in payload) {
		action = payload.action;
		const specificKey = `${type}.${action}` as EventKey;

		const specificHandler = eventHandlers[specificKey];
		if (specificHandler) {
			// @ts-expect-error: too complex for typescript
			// biome-ignore lint/suspicious/noExplicitAny: This is a workaround for the type system
			await specificHandler(payload as any, db);
			return;
		}
	}

	const generalHandler = eventHandlers[type];
	if (generalHandler) {
		// @ts-expect-error: too complex for typescript
		// biome-ignore lint/suspicious/noExplicitAny: This is a workaround for the type system
		await generalHandler(payload as any, db);
		return;
	}

	console.warn(`No handler found for ${type}${action ? `.${action}` : ""}`);
}
