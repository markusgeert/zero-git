CREATE TABLE "issues" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" text NOT NULL,
	"org_id" text NOT NULL,
	"repo_id" text NOT NULL,
	"name" text NOT NULL,
	"number" text NOT NULL,
	"state" text,
	"locked" boolean DEFAULT false NOT NULL,
	"body" text,
	"content" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_events" ALTER COLUMN "org_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "github_events" ALTER COLUMN "repo_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "github_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "pull_requests" ALTER COLUMN "github_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "pull_requests" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "repos" ALTER COLUMN "github_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "github_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "repos" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "repos" ADD COLUMN "fork" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "repos" ADD COLUMN "content" jsonb;