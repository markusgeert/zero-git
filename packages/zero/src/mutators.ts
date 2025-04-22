import type {
	CustomMutatorDefs,
	Transaction,
	UpdateValue,
} from "@rocicorp/zero";
import type { AuthData } from "@zero-git/auth";
import { assertIsLoggedIn } from "./auth.js";
import type { Schema } from "./zero-schema.js";

export function createMutators(authData: AuthData | undefined) {
	return {} as const satisfies CustomMutatorDefs<Schema>;
}

export type Mutators = ReturnType<typeof createMutators>;
