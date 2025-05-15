import type { PullRequest, WebhookEvent } from "@octokit/webhooks-types";
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
	githubId: integer("github_id"),
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

export const organizationsTable = pgTable("organizations", {
	id: text().primaryKey(),
	githubId: integer("github_id").notNull(),
	name: text("name").notNull(),
	displayName: text("diaplay_name").notNull(),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	modifiedAt: timestamp("modified_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const organizationsRelations = relations(
	organizationsTable,
	({ many }) => ({
		repos: many(reposTable),
	}),
);

export const reposTable = pgTable("repos", {
	id: text().primaryKey(),
	githubId: integer("github_id").notNull(),
	orgId: text("org_id").notNull(),
	name: text("name").notNull(),
	visibility: text().notNull().$type<"public" | "private">(),
	stars: integer("stars").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	modifiedAt: timestamp("modified_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const reposRelations = relations(reposTable, ({ one }) => ({
	org: one(organizationsTable, {
		fields: [reposTable.orgId],
		references: [organizationsTable.id],
	}),
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
	org: one(organizationsTable, {
		fields: [treesTable.orgId],
		references: [organizationsTable.id],
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
		org: one(organizationsTable, {
			fields: [treeNodesTable.orgId],
			references: [organizationsTable.id],
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
	org: one(organizationsTable, {
		fields: [nodesInTree.orgId],
		references: [organizationsTable.id],
	}),
	repo: one(reposTable, {
		fields: [nodesInTree.repoId],
		references: [reposTable.id],
	}),
}));

export const pullRequestsTable = pgTable("pull_requests", {
	id: text().primaryKey(),
	githubId: integer("github_id").notNull(),

	orgId: text("org_id").notNull(),
	repoId: text("repo_id").notNull(),

	title: text("name").notNull(),
	number: integer("number").notNull(),
	state: text("state").notNull().$type<"open" | ({} & string)>(),
	locked: boolean("locked").default(false).notNull(),
	body: text("body"),

	content: jsonb().notNull().$type<PullRequest>(),

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
		org: one(organizationsTable, {
			fields: [pullRequestsTable.orgId],
			references: [organizationsTable.id],
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

	content: jsonb().notNull().$type<WebhookEvent>(),

	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

// export const githubEventsRelations = relations(
// 	githubEventsTable,
// 	({ one }) => ({
// 		actor: one(usersTable, {
// 			fields: [githubEventsTable.actorId],
// 			references: [usersTable.id],
// 		}),
// 		org: one(organizationsTable, {
// 			fields: [githubEventsTable.orgId],
// 			references: [organizationsTable.id],
// 		}),
// 		repo: one(reposTable, {
// 			fields: [githubEventsTable.repoId],
// 			references: [reposTable.id],
// 		}),
// 	}),
// );
