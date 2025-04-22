import { issuer } from "@openauthjs/openauth";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { MemoryStorage } from "@openauthjs/openauth/storage/memory";
import { CodeUI } from "@openauthjs/openauth/ui/code";
import { schema, usersTable } from "@zero-git/db";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { nanoid } from "nanoid";
import { Octokit } from "octokit";
import { subjects } from "./subjects.ts";

function getEnvOrThrow(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing environment variable: ${key}`);
	}
	return value;
}

const connection = getEnvOrThrow("DATABASE_URL");

async function getUserByGithubId(githubId: number) {
	const db = drizzle({ connection, schema });
	return db.query.usersTable.findFirst({
		where: eq(usersTable.githubId, githubId),
	});
}

async function getUserByGithubEmail(githubEmail: string) {
	const db = drizzle({ connection, schema });
	return db.query.usersTable.findFirst({
		where: eq(usersTable.githubEmail, githubEmail),
	});
}

async function createNewUser(
	githubId: number,
	githubEmail: string,
	githubAvatarUrl: string,
	githubName: string | null,
) {
	const db = drizzle({ connection, schema });
	const [createdUser] = await db
		.insert(usersTable)
		.values({
			id: nanoid(),
			email: githubEmail,
			githubId,
			githubEmail,
			githubAvatarUrl,
			githubName,
		})
		.returning();

	return createdUser;
}

export default issuer({
	subjects,
	storage: MemoryStorage(),
	providers: {
		github: GithubProvider({
			clientID: getEnvOrThrow("GITHUB_CLIENT_ID"),
			clientSecret: getEnvOrThrow("GITHUB_CLIENT_SECRET"),
			scopes: ["user:email"],
		}),
	},
	success: async (ctx, value) => {
		if (value.provider === "github") {
			const octokit = new Octokit({
				auth: value.tokenset.access,
			});

			const { data } = await octokit.rest.users.getAuthenticated();
			const {
				id: githubId,
				email: githubEmail,
				avatar_url: githubAvatarUrl,
				name,
			} = data;

			if (!githubEmail) {
				throw new Error("Email not found");
			}

			let user = await getUserByGithubId(githubId);
			if (!user) {
				user = await getUserByGithubEmail(githubEmail);
			}

			if (!user) {
				user = await createNewUser(
					githubId,
					githubEmail,
					githubAvatarUrl,
					name,
				);
			}

			if (!user) {
				throw new Error("User not found, and could not create a new user");
			}

			return ctx.subject("user", {
				id: user.id,
				email: user.email,
			});
		}
		throw new Error("Invalid provider");
	},
});
