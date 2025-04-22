// import { definePermissions } from "@rocicorp/zero";
import { type Schema, schema } from "./zero-schema.gen.js";
import { type Mutators, createMutators } from "./mutators.js";

// export const permissions = definePermissions<{}, Schema>(schema, () => {
//   // ...further permissions definitions
// });

export { schema, type Schema, createMutators, type Mutators };
