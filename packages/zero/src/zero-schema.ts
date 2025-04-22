import {
	ANYONE_CAN,
	definePermissions,
	type PermissionsConfig,
} from "@rocicorp/zero";
import type { AuthData } from "@zero-git/auth";
import { createMutators, type Mutators } from "./mutators.js";
import { type Schema, schema } from "./zero-schema.gen.js";

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
	return {
		usersTable: {
			row: {
				select: ANYONE_CAN,
			},
		},
	} satisfies PermissionsConfig<AuthData, Schema>;
});

export { schema, type Schema, createMutators, type Mutators };
