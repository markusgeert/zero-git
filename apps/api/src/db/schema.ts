import { pgTable, text } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text().primaryKey(),
});

export const reposTable = pgTable("repos", {
  id: text().primaryKey(),
});
