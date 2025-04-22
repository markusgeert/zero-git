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
			createdAt: true,
			modifiedAt: true,
		},
		reposTable: {
			id: true,
			visibility: true,
			createdAt: true,
			modifiedAt: true,
		},
		githubEventsTable: {
			id: true,
			type: true,
			actorId: true,
			repoId: true,
			orgId: true,
			isPublic: true,
			content: true,
			createdAt: true,
		},
	},
});
