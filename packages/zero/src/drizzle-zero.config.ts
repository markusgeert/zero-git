import { schema } from "@zero-git/db";
import { drizzleZeroConfig } from "drizzle-zero";
export type * from "@octokit/webhooks-types";

export default drizzleZeroConfig(schema);
