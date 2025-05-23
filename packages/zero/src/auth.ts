import { assert, type AuthData } from "@zero-git/auth";

export function assertIsLoggedIn(
	authData: AuthData | undefined,
): asserts authData {
	assert(authData, "user must be logged in for this operation");
}

// export async function assertUserCanViewRepo(
// 	tx: Transaction<Schema, unknown>,
// 	authData: AuthData,
// 	repoId: string,
// ) {
// 	const repo = must(await tx.query.reposTable.where("id", repoId).one().run());
//
// 	assert(
// 		repo.visibility === "public" ||
// 			// authData.sub === repo.creatorID ||
// 			authData.role === "crew",
// 		"User does not have permission to view this repo",
// 	);
// }
