ALTER TABLE "issues" ADD COLUMN "pr_number" text;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "issue_number" text;