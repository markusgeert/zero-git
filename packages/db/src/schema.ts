import {
	boolean,
	integer,
	jsonb,
	pgTable,
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

export const reposTable = pgTable("repos", {
	id: text().primaryKey(),
	org: text("org").notNull(),
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

export const githubEventsTable = pgTable("github_events", {
	id: text().primaryKey(),
	type: text().notNull(),
	actorId: text("actor_id").notNull(),
	repoId: text("repo_id").notNull(),
	orgId: text("org_id").notNull(),
	isPublic: boolean("is_public").notNull(),
	content: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});
