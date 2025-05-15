ALTER TABLE "github_events" ADD COLUMN "action" text;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "content" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "github_events" DROP COLUMN "actor_id";--> statement-breakpoint
ALTER TABLE "github_events" DROP COLUMN "repo_id";--> statement-breakpoint
ALTER TABLE "github_events" DROP COLUMN "org_id";--> statement-breakpoint
ALTER TABLE "github_events" DROP COLUMN "is_public";