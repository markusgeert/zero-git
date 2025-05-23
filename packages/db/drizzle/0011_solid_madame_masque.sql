ALTER TABLE "issue_comments" ALTER COLUMN "issue_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "issue_comments" ADD COLUMN "issue_number" text;--> statement-breakpoint
ALTER TABLE "review_comments" ADD COLUMN "pr_number" text;