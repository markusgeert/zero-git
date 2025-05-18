import type { CustomMutatorDefs } from "@rocicorp/zero";
import type { AuthData } from "@zero-git/auth";
import { assertIsLoggedIn } from "./auth.js";
import type { Schema } from "./zero-schema.js";

interface CreateRepoArgs {
	id: string;
	githubId: string;

	name: string;
	visibility: "public" | "private";
	stars?: number;

	orgId: string;
	orgGithubId: string;
	orgName: string;
}

export function createMutators(authData: AuthData | undefined) {
	return {
		reposTable: {
			create: async (
				tx,
				{
					id,
					orgId,
					orgGithubId,
					orgName,
					githubId,
					name,
					visibility,
					stars,
				}: CreateRepoArgs,
			) => {
				assertIsLoggedIn(authData);

				await tx.mutate.organizationsTable?.insert({
					id: orgId,
					githubId: orgGithubId,
					name: orgName,
					displayName: orgName,
				});
				await tx.mutate.reposTable?.insert({
					id,
					githubId,
					name,
					visibility,
					orgId,
					fork: false,
					stars: stars ?? 0,
				});
			},
		},
	} as const satisfies CustomMutatorDefs<Schema>;
}

export type Mutators = ReturnType<typeof createMutators>;
