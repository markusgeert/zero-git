<script setup lang="ts">
import { useZero } from "@/composables/useZero";
import { CACHE_AWHILE } from "@/query-cache-policy";
import { useRouteParams } from "@vueuse/router";
import { useQuery } from "zero-vue";

// import type { Row } from "@rocicorp/zero";
// import type { schema } from "@zero-git/zero";
// type PRRow = Row<typeof schema.tables.pullRequestsTable>;
// type GithubUsersRow = Row<typeof schema.tables.githubUsersTable>;

// Get route parameters
const repoName = useRouteParams<string>("repo");
const orgName = useRouteParams<string>("org");
const prNumber = useRouteParams<string>("prId");

// Initialize Zero
const z = useZero();

// First get the repository
const { data: repo } = useQuery(
	() =>
		z.value.query.reposTable
			.where("name", repoName.value || "")
			.whereExists("org", (q) => q.where("name", orgName.value || ""))
			.one(),
	CACHE_AWHILE,
);

// Then get the PR using the repo ID and PR number
const { data: pr, status: prStatus } = useQuery(
	() =>
		z.value.query.pullRequestsTable
			.where("repoId", repo.value?.id ?? "")
			.where("number", Number(prNumber.value))
			.related("creator")
			.one(),
	CACHE_AWHILE,
);
</script>

<template>
	<AppContainer v-if="pr || prStatus === 'complete'">
		<div v-if="!pr">
			<p class="text-sm text-gray-500">No PR found</p>
		</div>
		<div v-else class="flex flex-col gap-4">
			<h1 class="text-2xl font-bold">{{ pr.title }}</h1>
			<div class="flex items-center gap-2">
				<span
					class="px-2 py-1 text-xs rounded-full"
					:class="{
						'bg-green-100 text-green-800': pr.state === 'open',
						'bg-purple-100 text-purple-800': pr.state === 'merged',
						'bg-red-100 text-red-800': pr.state === 'closed',
						'bg-gray-100 text-gray-800': pr.state === 'draft',
					}"
				>
					{{ pr.state }}
				</span>
				<span class="text-sm">
					PR #{{ pr.number }} by {{ pr.creator?.name }}
				</span>
			</div>
			<p v-if="pr.body" class="mt-4 text-sm">{{ pr.body }}</p>
		</div>
	</AppContainer>
</template>
