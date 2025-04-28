CREATE TABLE "nodes_in_tree" (
	"tree_sha" text NOT NULL,
	"node_sha" text NOT NULL,
	"org_id" text NOT NULL,
	"repo_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone,
	CONSTRAINT "nodes_in_tree_tree_sha_node_sha_pk" PRIMARY KEY("tree_sha","node_sha")
);
--> statement-breakpoint
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
CREATE TABLE "pull_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" integer NOT NULL,
	"org_id" text NOT NULL,
	"repo_id" text NOT NULL,
	"name" text NOT NULL,
	"number" integer NOT NULL,
	"state" text NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tree_nodes" (
	"sha" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"repo_id" text NOT NULL,
	"path" text NOT NULL,
	"mode" text NOT NULL,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trees" (
	"sha" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"repo_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repos" ADD COLUMN "github_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "repos" ADD COLUMN "org_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "repos" DROP COLUMN "org";