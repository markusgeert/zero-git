CREATE TABLE "issue_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" text NOT NULL,
	"org_id" text NOT NULL,
	"repo_id" text NOT NULL,
	"issue_id" text NOT NULL,
	"author_id" text,
	"body" text,
	"content" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" text NOT NULL,
	"review_id" text,
	"org_id" text NOT NULL,
	"repo_id" text NOT NULL,
	"author_id" text NOT NULL,
	"diff_hunk" text,
	"path" text NOT NULL,
	"body" text NOT NULL,
	"in_reply_to_comment_id" text,
	"content" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" text NOT NULL,
	"org_id" text NOT NULL,
	"repo_id" text NOT NULL,
	"pr_id" text NOT NULL,
	"commit_id" text,
	"state" text,
	"body" text,
	"author_id" text,
	"author_association" text,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "author_id" text;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "draft" boolean;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "merged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "closed_at" timestamp with time zone;