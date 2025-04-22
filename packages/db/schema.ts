import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text().primaryKey(),
  email: text().notNull(),
  githubId: integer(),
  githubEmail: text(),
  githubAvatarUrl: text(),
  githubName: text(),
});

export const reposTable = pgTable("repos", {
  id: text().primaryKey(),
  visibility: text().notNull().$type<"public" | "private">(),
});
