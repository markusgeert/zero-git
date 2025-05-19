ALTER TABLE "organizations" RENAME TO "github_users";--> statement-breakpoint
ALTER TABLE "pull_requests" RENAME COLUMN "org_id" TO "owner_id";--> statement-breakpoint
ALTER TABLE "github_users" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "creator_id" text NOT NULL;