import {
	ANYONE_CAN,
	type PermissionsConfig,
	definePermissions,
} from "@rocicorp/zero";
import type { AuthData } from "@zero-git/auth";
import { type Mutators, createMutators } from "./mutators.js";
import { type Schema, schema } from "./zero-schema.gen.js";

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
	return {
		githubUsersTable: {
			row: {
				select: ANYONE_CAN,
			},
		},
		usersTable: {
			row: {
				select: ANYONE_CAN,
			},
		},
		reposTable: {
			row: {
				select: ANYONE_CAN,
			},
		},
		pullRequestsTable: {
			row: {
				select: ANYONE_CAN,
			},
		},
	} satisfies PermissionsConfig<AuthData, Schema>;
});

export { schema, type Schema, createMutators, type Mutators };
