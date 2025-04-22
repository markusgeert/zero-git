import { createMutators, type Mutators } from "./mutators.js";
// import { definePermissions } from "@rocicorp/zero";
import { type Schema, schema } from "./zero-schema.gen.js";

// export const permissions = definePermissions<{}, Schema>(schema, () => {
//   // ...further permissions definitions
// });

export { schema, type Schema, createMutators, type Mutators };
