import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { seed } from "drizzle-seed";
import * as schema from "../src/schema.js";
// import { githubUsersTable, reposTable } from "../src/schema.js";

async function main() {
	console.log("Seeding database...");

	const userIds: number[] = [];
	for (let i = 1; i <= 10; i++) {
		userIds.push(i);
	}

	const db = drizzle({
		connection: process.env.DATABASE_URL as string,
		schema,
	});
	await migrate(db, { migrationsFolder: "./drizzle" });
	await seed(db, schema).refine((f) => ({
		githubUsersTable: {
			count: 10,
			columns: {
				id: f.intPrimaryKey(),
				githubId: f.intPrimaryKey(),
				modifiedAt: f.date({ maxDate: new Date() }),
				createdAt: f.date({ maxDate: new Date() }),
			},
			with: {
				reposTable: 10,
			},
		},
		reposTable: {
			count: 10,
			columns: {
				id: f.intPrimaryKey(),
				githubId: f.intPrimaryKey(),
				visibility: f.valuesFromArray({ values: ["public", "private"] }),
				modifiedAt: f.date({ maxDate: new Date() }),
				createdAt: f.date({ maxDate: new Date() }),
				stars: f.int({ minValue: 0, maxValue: 100_000 }),
			},
		},
		issuesTable: {
			columns: {
				id: f.intPrimaryKey(),
				githubId: f.intPrimaryKey(),
				number: f.intPrimaryKey(),
				prNumber: f.intPrimaryKey(),
				repoId: f.intPrimaryKey(),
			},
			with: {
				pullRequestsTable: 1,
				issueCommentsTable: 10,
			},
		},
		issueCommentsTable: {
			columns: {
				id: f.intPrimaryKey(),
				issueNumber: f.valuesFromArray({
					values: Array.from({ length: 100 }, (_, i) => i + 1),
				}),
			},
		},
		pullRequestsTable: {
			columns: {
				title: f.loremIpsum(),
				id: f.intPrimaryKey(),
				githubId: f.intPrimaryKey(),
				creatorId: f.valuesFromArray({ values: userIds }),
				ownerId: f.valuesFromArray({ values: userIds }),
				number: f.intPrimaryKey(),
				repoId: f.intPrimaryKey(),
				issueNumber: f.intPrimaryKey(),
				state: f.valuesFromArray({
					values: ["open", "closed", "merged", "draft"],
				}),
				locked: f.weightedRandom([
					{
						weight: 0.9,
						value: f.default({ defaultValue: false }),
					},
					{
						weight: 0.1,
						value: f.default({ defaultValue: true }),
					},
				]),
				body: f.loremIpsum({ sentencesCount: 8 }),
				modifiedAt: f.date({ maxDate: new Date() }),
				createdAt: f.date({ maxDate: new Date() }),
			},
		},
	}));

	console.log("Seeding complete.");
	process.exit(0);
}
await main();
