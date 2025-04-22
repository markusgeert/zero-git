import type { CustomMutatorDefs } from "@rocicorp/zero";
import type { AuthData } from "@zero-git/auth";
import { type Schema, createMutators } from "@zero-git/zero";

export type PostCommitTask = () => Promise<void>;

export function createServerMutators(
  authData: AuthData | undefined,
  postCommitTasks: PostCommitTask[],
) {
  const mutators = createMutators(authData);

  return {
    ...mutators,
  } as const satisfies CustomMutatorDefs<Schema>;
}
