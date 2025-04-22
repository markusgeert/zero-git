CREATE TABLE "repos" (
	"id" text PRIMARY KEY NOT NULL,
	"visibility" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"githubId" integer,
	"githubEmail" text,
	"githubAvatarUrl" text,
	"githubName" text
);
