import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { seed } from "drizzle-seed";
import * as schema from "../src/schema.js";

async function main() {
	console.log("Seeding database...");

	const db = drizzle(process.env.DATABASE_URL as string);
	await migrate(db, { migrationsFolder: "./drizzle" });
	await seed(db, schema).refine((f) => ({
		organizationsTable: {
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
			columns: {
				id: f.intPrimaryKey(),
				githubId: f.intPrimaryKey(),
				visibility: f.valuesFromArray({ values: ["public", "private"] }),
				modifiedAt: f.date({ maxDate: new Date() }),
				createdAt: f.date({ maxDate: new Date() }),
				stars: f.int({ minValue: 0, maxValue: 100_000 }),
			},
			with: {
				pullRequestsTable: 10,
			},
		},
		pullRequestsTable: {
			columns: {
				title: f.loremIpsum(),
				id: f.intPrimaryKey(),
				githubId: f.intPrimaryKey(),
				number: f.intPrimaryKey(),
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
				modifiedAt: f.date({ maxDate: new Date() }),
				createdAt: f.date({ maxDate: new Date() }),
			},
		},
	}));

	console.log("Seeding complete.");
	process.exit(0);
}
await main();
