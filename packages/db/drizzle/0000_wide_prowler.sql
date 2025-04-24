CREATE TABLE "github_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"actor_id" text NOT NULL,
	"repo_id" text NOT NULL,
	"org_id" text NOT NULL,
	"is_public" boolean NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repos" (
	"id" text PRIMARY KEY NOT NULL,
	"org" text NOT NULL,
	"name" text NOT NULL,
	"visibility" text NOT NULL,
	"stars" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"github_id" integer,
	"github_email" text,
	"github_avatar_url" text,
	"github_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
