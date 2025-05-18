import { issuer } from "@openauthjs/openauth";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { MemoryStorage } from "@openauthjs/openauth/storage/memory";
import { Select } from "@openauthjs/openauth/ui/select";
import { THEME_OPENAUTH } from "@openauthjs/openauth/ui/theme";
import { subjects } from "@zero-git/auth";
import { schema, usersTable } from "@zero-git/db";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { nanoid } from "nanoid";
import { Octokit } from "octokit";

function getEnvOrThrow(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing environment variable: ${key}`);
	}
	return value;
}

const connection = getEnvOrThrow("DATABASE_URL");

async function getUserByGithubId(githubId: string) {
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
	githubId: string,
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
	theme: THEME_OPENAUTH,
	select: Select({
		providers: {
			github: { hide: false },
		},
	}),
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
			const { id, avatar_url: githubAvatarUrl, name } = data;
			const githubId = id.toString();

			let user = await getUserByGithubId(githubId);
			if (!user) {
				const { data: emails } =
					await octokit.rest.users.listEmailsForAuthenticatedUser();
				const githubEmail = emails.find(
					(email) => email.primary && email.verified,
				)?.email;
				if (!githubEmail) {
					throw new Error("No verified, primary email found");
				}

				user = await getUserByGithubEmail(githubEmail);
				if (!user) {
					user = await createNewUser(
						githubId,
						githubEmail,
						githubAvatarUrl,
						name,
					);
				}
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
