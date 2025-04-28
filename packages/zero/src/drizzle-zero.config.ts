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
		organizationsTable: {
			id: true,
			name: true,
			displayName: true,
			avatarUrl: true,
			githubId: true,
			createdAt: true,
			modifiedAt: true,
		},
		reposTable: {
			id: true,
			githubId: true,
			orgId: true,
			name: true,
			stars: true,
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
