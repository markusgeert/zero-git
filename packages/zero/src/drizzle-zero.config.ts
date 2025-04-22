import { schema } from "@zero-git/db";
import { drizzleZeroConfig } from "drizzle-zero";

export default drizzleZeroConfig(schema, {
  tables: {
    usersTable: {
      id: true,
      email: true,
      githubId: false,
      githubName: false,
      githubEmail: false,
      githubAvatarUrl: true,
    },
    reposTable: {
      id: true,
      visibility: true,
    },
  },
});
