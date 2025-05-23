import { createAppAuth } from "@octokit/auth-app";
import type { components } from "@octokit/openapi-types";
import { Octokit, type RestEndpointMethodTypes } from "@octokit/rest";
import type {
	Installation,
	Issue,
	PullRequest,
	Repository,
	User,
	WebhookEvent,
	WebhookEventMap,
	WebhookEventName,
} from "@octokit/webhooks-types";
import {
	githubUsersTable,
	issueCommentsTable,
	issuesTable,
	pullRequestsTable,
	reposTable,
	reviewCommentsTable,
	reviewsTable,
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

async function upsertRepo(repo: Repo, db: DBType) {
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
				visibility: repo.visibility as "public" | "private" | "internal",
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

type Repo = Repository | components["schemas"]["full-repository"];

function mapPR(pr: PR): InferInsertModel<typeof pullRequestsTable> {
	return {
		id: pr.id.toString(),
		githubId: pr.id.toString(),
		ownerId: pr.base.repo.owner.id.toString(),
		repoId: pr.base.repo.id.toString(),
		creatorId: pr.user?.id.toString() ?? "",
		title: pr.title,
		number: pr.number,
		state: pr.state as "open" | "closed",
		locked: pr.locked,
		draft: pr.draft ?? false,
		body: pr.body,
		content: pr,
		mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
		closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
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
				draft: sql.raw(`excluded.${pullRequestsTable.draft.name}`),
				mergedAt: sql.raw(`excluded.${pullRequestsTable.mergedAt.name}`),
				closedAt: sql.raw(`excluded.${pullRequestsTable.closedAt.name}`),
			},
		});
}

async function upsertUsers(
	users: components["schemas"]["simple-user"][],
	db: DBType,
) {
	if (users.length === 0) {
		return;
	}

	return db
		.insert(githubUsersTable)
		.values(
			users.map((user) => ({
				id: user.id.toString(),
				githubId: user.id.toString(),
				name: user.login,
				avatarUrl: user.avatar_url,
				type: user.type as "User" | "Bot" | "Organization",
			})),
		)
		.onConflictDoUpdate({
			target: githubUsersTable.id,
			set: {
				name: sql.raw(`excluded.${githubUsersTable.name.name}`),
				avatarUrl: sql.raw(`excluded.${githubUsersTable.avatarUrl.name}`),
				type: sql.raw(`excluded.${githubUsersTable.type.name}`),
			},
		});
}

async function upsertUsersFromPullRequests(
	pulls: components["schemas"]["pull-request-simple"][],
	db: DBType,
) {
	const usersToUpsert = new Map<string, components["schemas"]["simple-user"]>();

	for (const pull of pulls) {
		const { user, assignee, assignees, requested_reviewers } = pull;

		if (user) {
			usersToUpsert.set(user.id.toString(), user);
		}

		if (assignee) {
			usersToUpsert.set(assignee.id.toString(), assignee);
		}

		if (assignees) {
			for (const assignee of assignees) {
				usersToUpsert.set(assignee.id.toString(), assignee);
			}
		}

		if (requested_reviewers) {
			for (const reviewer of requested_reviewers) {
				usersToUpsert.set(reviewer.id.toString(), reviewer);
			}
		}
	}

	return await upsertUsers(Array.from(usersToUpsert.values()), db);
}

async function upsertIssue(issue: Issue, repository: Repository, db: DBType) {
	await db
		.insert(issuesTable)
		.values({
			id: issue.id.toString(),
			githubId: issue.id.toString(),
			orgId: repository.owner.id.toString(),
			repoId: repository.id.toString(),
			authorId: issue.user?.id.toString(),
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
				authorId: issue.user?.id.toString(),
				modifiedAt: new Date(issue.updated_at),
			},
		});
}

async function fetchIssueComments(repo: Repo, octokit: Octokit) {
	return await octokit.paginate("GET /repos/{owner}/{repo}/issues/comments", {
		owner: repo.owner.login,
		repo: repo.name,
		per_page: 100,
	});
}

async function upsertIssueComments(
	comments: (components["schemas"]["issue-comment"] & {
		orgId: string;
		repoId: string;
		issueId: string;
	})[],
	db: DBType,
) {
	if (comments.length === 0) {
		return;
	}

	return db
		.insert(issueCommentsTable)
		.values(
			comments.map((comment) => {
				return {
					id: comment.id.toString(),
					githubId: comment.id.toString(),

					orgId: comment.orgId,
					repoId: comment.repoId,
					issueId: comment.issueId,

					body: comment.body,
					// biome-ignore lint/suspicious/noExplicitAny: This is a workaround for the type system
					content: comment as any,
					authorId: comment.user?.id.toString(),
					submittedAt: comment.created_at ? new Date(comment.created_at) : null,
				};
			}),
		)
		.onConflictDoUpdate({
			target: issuesTable.id,
			set: {
				body: sql.raw(`excluded.${issuesTable.body.name}`),
				modifiedAt: sql.raw(`excluded.${issuesTable.modifiedAt.name}`),
			},
		});
}

async function fetchReviews(pulls: PR[], octokit: Octokit) {
	const reviews = await Promise.all(
		pulls.map((pr) =>
			octokit
				.paginate("GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews", {
					owner: pr.base.repo.owner.login,
					repo: pr.base.repo.name,
					pull_number: pr.number,
					per_page: 100,
				})
				.then((res) =>
					res.map((review) => ({
						...review,
						orgId: pr.base.repo.owner.id.toString(),
						repoId: pr.base.repo.id.toString(),
						prId: pr.id.toString(),
					})),
				),
		),
	);

	return reviews.flat();
}

async function upsertReviews(
	reviews: (components["schemas"]["pull-request-review"] & {
		orgId: string;
		repoId: string;
		prId: string;
	})[],
	db: DBType,
) {
	if (reviews.length === 0) {
		return;
	}

	return await db
		.insert(reviewsTable)
		.values(
			reviews.map((review) => {
				return {
					id: review.id.toString(),
					githubId: review.id.toString(),

					orgId: review.orgId,
					repoId: review.repoId,
					prId: review.prId,

					state: review.state,
					body: review.body,
					authorId: review.user?.id.toString(),
					submittedAt: review.submitted_at
						? new Date(review.submitted_at)
						: null,
				};
			}),
		)
		.onConflictDoUpdate({
			target: reviewsTable.id,
			set: {
				orgId: sql.raw(`excluded.${reviewsTable.orgId.name}`),
				repoId: sql.raw(`excluded.${reviewsTable.repoId.name}`),
				prId: sql.raw(`excluded.${reviewsTable.prId.name}`),
				state: sql.raw(`excluded.${reviewsTable.state.name}`),
				authorId: sql.raw(`excluded.${reviewsTable.authorId.name}`),
				body: sql.raw(`excluded.${reviewsTable.body.name}`),
				modifiedAt: sql.raw(`excluded.${reviewsTable.modifiedAt.name}`),
			},
		});
}

async function fetchReviewComments(repo: Repo, octokit: Octokit) {
	return await octokit.paginate("GET /repos/{owner}/{repo}/pulls/comments", {
		owner: repo.owner.login,
		repo: repo.name,
		per_page: 100,
	});
}

async function upsertReviewComments(
	comments: (components["schemas"]["pull-request-review-comment"] & {
		orgId: string;
		repoId: string;
		prId: string;
	})[],
	db: DBType,
) {
	if (comments.length === 0) {
		return;
	}

	return db
		.insert(reviewCommentsTable)
		.values(
			comments.map((comment) => {
				return {
					id: comment.id.toString(),
					githubId: comment.id.toString(),
					orgId: comment.orgId,
					repoId: comment.repoId,
					prId: comment.prId,
					reviewId: comment.pull_request_review_id?.toString(),
					diffHunk: comment.diff_hunk,
					path: comment.path,
					body: comment.body,
					inReplyToCommentId: comment.in_reply_to_id?.toString(),
					// biome-ignore lint/suspicious/noExplicitAny: This is a workaround for the type system
					content: comment as any,
					authorId: comment.user?.id.toString(),
					submittedAt: comment.created_at ? new Date(comment.created_at) : null,
				};
			}),
		)
		.onConflictDoUpdate({
			target: reviewCommentsTable.id,
			set: {
				path: sql.raw(`excluded.${reviewCommentsTable.path.name}`),
				body: sql.raw(`excluded.${reviewCommentsTable.body.name}`),
				modifiedAt: sql.raw(`excluded.${reviewCommentsTable.modifiedAt.name}`),
				content: sql.raw(`excluded.${reviewCommentsTable.content.name}`),
			},
		});
}

async function fetchPulls(repo: Repo, octokit: Octokit) {
	return await octokit.paginate("GET /repos/{owner}/{repo}/pulls", {
		owner: repo.owner.login,
		repo: repo.name,
		state: "all",
		per_page: 100,
	});
}

async function fetchOrgMembers(org: User, octokit: Octokit) {
	if (org.type !== "Organization") {
		return [];
	}

	return await octokit.paginate("GET /orgs/{org}/members", {
		org: org.login,
		per_page: 100,
	});
}
async function upsertOrgMembers(
	members: components["schemas"]["simple-user"][],
	db: DBType,
) {
	if (members.length === 0) {
		return;
	}

	return db
		.insert(githubUsersTable)
		.values(
			members.map((user) => ({
				id: user.id.toString(),
				githubId: user.id.toString(),
				name: user.login,
				avatarUrl: user.avatar_url,
				type: user.type as "User" | "Bot" | "Organization",
			})),
		)
		.onConflictDoUpdate({
			target: githubUsersTable.id,
			set: {
				name: sql.raw(`excluded.${githubUsersTable.name.name}`),
				avatarUrl: sql.raw(`excluded.${githubUsersTable.avatarUrl.name}`),
				type: sql.raw(`excluded.${githubUsersTable.type.name}`),
			},
		});
}

async function fetchIssues(repo: Repo, octokit: Octokit) {
	return await octokit
		.paginate("GET /repos/{owner}/{repo}/issues", {
			owner: repo.owner.login,
			repo: repo.name,
			per_page: 100,
		})
		.then((issues) =>
			issues.map((issue) => ({
				...issue,
				orgId: repo.owner.id.toString(),
				repoId: repo.id.toString(),
			})),
		);
}

async function upsertIssues(
	issues: (components["schemas"]["issue"] & {
		orgId: string;
		repoId: string;
	})[],
	db: DBType,
) {
	if (issues.length === 0) {
		return;
	}

	return db
		.insert(issuesTable)
		.values(
			issues.map((issue) => {
				return {
					id: issue.id.toString(),
					githubId: issue.id.toString(),

					orgId: issue.orgId,
					repoId: issue.repoId,

					title: issue.title,
					number: issue.number,
					state: issue.state as "open" | "closed",
					locked: issue.locked,
					body: issue.body,
					authorId: issue.user?.id.toString(),

					// biome-ignore lint/suspicious/noExplicitAny: This is a workaround for the type system
					content: issue as any,
					createdAt: new Date(issue.created_at),
					modifiedAt: new Date(issue.updated_at),
				};
			}),
		)
		.onConflictDoUpdate({
			target: issuesTable.id,
			set: {
				title: sql.raw(`excluded.${issuesTable.title.name}`),
				state: sql.raw(`excluded.${issuesTable.state.name}`),
				locked: sql.raw(`excluded.${issuesTable.locked.name}`),
				body: sql.raw(`excluded.${issuesTable.body.name}`),
				content: sql.raw(`excluded.${issuesTable.content.name}`),
				modifiedAt: sql.raw(`excluded.${issuesTable.modifiedAt.name}`),
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
			? p.repositories.map(async (repoMeta) => {
					const { data: repo } = await octokit.rest.repos.get({
						owner: p.installation.account.login,
						repo: repoMeta.name,
					});

					return Promise.allSettled([
						fetchPulls(repo, octokit).then((pulls) =>
							Promise.allSettled([
								upsertPulls(pulls.map(mapPR), db),
								upsertUsersFromPullRequests(pulls, db),
								fetchReviews(pulls, octokit).then((reviews) =>
									upsertReviews(reviews, db),
								),
							]),
						),
						upsertRepo(repo, db),
						fetchIssues(repo, octokit).then((issues) =>
							upsertIssues(issues, db),
						),
						// fetchReviewComments(repo, octokit).then((comments) =>
						// 	upsertReviewComments(comments, db),
						// ),
						// fetchIssueComments(repo, octokit).then((comments) =>
						// 	upsertIssueComments(comments, db),
						// ),
					]);
				})
			: [];

		const promisesToResolve = [
			upsertUserFromInstallation(p.installation, db),
			fetchOrgMembers(p.installation.account, octokit).then((members) =>
				upsertOrgMembers(members, db),
			),
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
