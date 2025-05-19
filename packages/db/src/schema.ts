import type { RestEndpointMethodTypes } from "@octokit/rest";
import type {
	Issue,
	PullRequest,
	Repository,
	WebhookEvent,
} from "@octokit/webhooks-types";
import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
	id: text().primaryKey(),
	email: text().notNull(),
	githubId: text("github_id"),
	githubEmail: text("github_email"),
	githubAvatarUrl: text("github_avatar_url"),
	githubName: text("github_name"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	modifiedAt: timestamp("modified_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const githubUsersTable = pgTable("github_users", {
	id: text().primaryKey(),
	githubId: text("github_id").notNull(),

	name: text("name").notNull(),
	avatarUrl: text("avatar_url"),

	type: text("type").notNull().$type<"Bot" | "User" | "Organization">(),

	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	modifiedAt: timestamp("modified_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const githubUsersRelations = relations(githubUsersTable, ({ many }) => ({
	repos: many(reposTable),
}));

export const reposTable = pgTable("repos", {
	id: text().primaryKey(),
	githubId: text("github_id").notNull(),
	orgId: text("org_id").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	fork: boolean("fork").notNull(),
	visibility: text().$type<"public" | "private" | "internal">(),
	stars: integer("stars").default(0).notNull(),

	content: jsonb().$type<Repository>(),

	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	modifiedAt: timestamp("modified_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const reposRelations = relations(reposTable, ({ one, many }) => ({
	org: one(githubUsersTable, {
		fields: [reposTable.orgId],
		references: [githubUsersTable.id],
	}),
	pulls: many(pullRequestsTable),
}));

export const treesTable = pgTable("trees", {
	sha: text().primaryKey().notNull(),
	orgId: text("org_id").notNull(),
	repoId: text("repo_id").notNull(),

	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	modifiedAt: timestamp("modified_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const treesRelations = relations(treesTable, ({ many, one }) => ({
	nodesInTree: many(nodesInTree),
	org: one(githubUsersTable, {
		fields: [treesTable.orgId],
		references: [githubUsersTable.id],
	}),
	repo: one(reposTable, {
		fields: [treesTable.repoId],
		references: [reposTable.id],
	}),
}));

export const treeNodesTable = pgTable("tree_nodes", {
	sha: text().primaryKey().notNull(),
	orgId: text("org_id").notNull(),
	repoId: text("repo_id").notNull(),

	path: text("path").notNull(),
	mode: text("mode").notNull(),
	type: text("type").notNull(),
	size: integer("size").notNull(),

	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	modifiedAt: timestamp("modified_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const treeNodesRelations = relations(
	treeNodesTable,
	({ many, one }) => ({
		nodesInTree: many(nodesInTree),
		org: one(githubUsersTable, {
			fields: [treeNodesTable.orgId],
			references: [githubUsersTable.id],
		}),
		repo: one(reposTable, {
			fields: [treeNodesTable.repoId],
			references: [reposTable.id],
		}),
	}),
);

export const nodesInTree = pgTable(
	"nodes_in_tree",
	{
		tree_sha: text("tree_sha").notNull(),
		node_sha: text("node_sha").notNull(),

		orgId: text("org_id").notNull(),
		repoId: text("repo_id").notNull(),

		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		modifiedAt: timestamp("modified_at", { withTimezone: true }),
	},
	(table) => [primaryKey({ columns: [table.tree_sha, table.node_sha] })],
);

export const nodesInTreeRelations = relations(nodesInTree, ({ one }) => ({
	tree: one(treesTable, {
		fields: [nodesInTree.tree_sha],
		references: [treesTable.sha],
	}),
	node: one(treeNodesTable, {
		fields: [nodesInTree.node_sha],
		references: [treeNodesTable.sha],
	}),
	org: one(githubUsersTable, {
		fields: [nodesInTree.orgId],
		references: [githubUsersTable.id],
	}),
	repo: one(reposTable, {
		fields: [nodesInTree.repoId],
		references: [reposTable.id],
	}),
}));

type PR =
	| PullRequest
	| RestEndpointMethodTypes["pulls"]["list"]["response"]["data"][number];

export const pullRequestsTable = pgTable("pull_requests", {
	id: text().primaryKey(),
	githubId: text("github_id").notNull(),

	ownerId: text("owner_id").notNull(),
	repoId: text("repo_id").notNull(),
	creatorId: text("creator_id").notNull(),

	title: text("name").notNull(),
	number: integer("number").notNull(),
	state: text("state").notNull().$type<"open" | ({} & string)>(),
	locked: boolean("locked").default(false).notNull(),
	body: text("body"),

	content: jsonb().$type<PR>(),

	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	modifiedAt: timestamp("modified_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const pullRequestsRelations = relations(
	pullRequestsTable,
	({ one }) => ({
		owner: one(githubUsersTable, {
			fields: [pullRequestsTable.ownerId],
			references: [githubUsersTable.id],
		}),
		creator: one(githubUsersTable, {
			fields: [pullRequestsTable.creatorId],
			references: [githubUsersTable.id],
		}),
		repo: one(reposTable, {
			fields: [pullRequestsTable.repoId],
			references: [reposTable.id],
		}),
	}),
);

export const githubEventsTable = pgTable("github_events", {
	id: text().primaryKey(),
	type: text().notNull(),
	action: text(),

	orgId: text("org_id"),
	repoId: text("repo_id"),

	content: jsonb().notNull().$type<WebhookEvent>(),

	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const githubEventsRelations = relations(
	githubEventsTable,
	({ one }) => ({
		org: one(githubUsersTable, {
			fields: [githubEventsTable.orgId],
			references: [githubUsersTable.id],
		}),
		repo: one(reposTable, {
			fields: [githubEventsTable.repoId],
			references: [reposTable.id],
		}),
	}),
);

export const issuesTable = pgTable("issues", {
	id: text().primaryKey(),
	githubId: text("github_id").notNull(),

	orgId: text("org_id").notNull(),
	repoId: text("repo_id").notNull(),

	title: text("name").notNull(),
	number: integer("number").notNull(),
	state: text("state").$type<"closed" | "open" | null>(),
	locked: boolean("locked").default(false).notNull(),
	body: text("body"),

	content: jsonb().$type<Issue>(),

	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	modifiedAt: timestamp("modified_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});
