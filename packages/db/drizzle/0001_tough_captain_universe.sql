CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" integer NOT NULL,
	"name" text NOT NULL,
	"diaplay_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repos" ADD COLUMN "github_id" integer NOT NULL;