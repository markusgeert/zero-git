<script setup lang="ts">
import { useZero } from "@/composables/useZero";
import { CACHE_AWHILE } from "@/query-cache-policy";
import { useRouteParams } from "@vueuse/router";
import { computed } from "vue";
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

// Then get the PR using the repo ID and PR number
const { data: comments } = useQuery(
	() =>
		z.value.query.issueCommentsTable
			.where("repoId", repo.value?.id ?? "")
			.where("issueNumber", pr.value?.issueNumber ?? "")
			.orderBy("createdAt", "asc")
			.related("author"),
	CACHE_AWHILE,
);

const prState = computed(() => {
	if (pr.value?.mergedAt) return "merged";
	if (pr.value?.closedAt) return "closed";
	return pr.value?.draft ? "draft" : "open";
});
</script>

<template>
	<AppContainer v-if="pr || prStatus === 'complete'">
		<div class="grid-cols-[1fr_200px] md:grid">
			<div class="overflow-hidden">
				<div v-if="!pr">
					<p class="text-sm text-gray-500">No PR found</p>
				</div>
				<div v-else class="flex flex-col gap-4">
					<h1 class="text-3xl font-semibold">
						{{ pr.title }}
						<span class="text-dimmed font-normal">#{{ pr.number }}</span>
					</h1>
					<div class="flex items-center gap-2">
						<span
							class="px-2 py-1 text-xs rounded-full"
							:class="{
								'bg-green-500 text-white': prState === 'open',
								'bg-violet-500 text-white': prState === 'merged',
								'bg-red-500 text-white': prState === 'closed',
								'bg-zinc-400 text-white': prState === 'draft',
							}"
						>
							{{ prState }}
						</span>
						<span class="text-sm">
							<template v-if="pr.mergedAt">
								{{ pr.creator?.name }} merged 1 commit into
								{{ pr.content?.base?.ref }} from {{ pr.content?.head?.ref }}
							</template>
							<template v-else>
								{{ pr.creator?.name }} wants to merge 1 commit into
								{{ pr.content?.base?.ref }} from {{ pr.content?.head?.ref }}
							</template>
						</span>
					</div>
					<AppMarkdown v-if="pr.body" class="pb-4" :md="pr.body" />
				</div>
				<div>
					<span> Comments </span>
				</div>
				<div
					v-for="comment in comments"
					:key="comment.id"
					class="flex flex-col gap-4 p-4 border border-default rounded-lg"
				>
					<div class="flex">
						<img
							:src="comment.author?.avatarUrl ?? ''"
							class="w-8 h-8 rounded-full mr-2"
						/>
						{{ comment.author?.name }}
					</div>
					<AppMarkdown v-if="comment.body" :md="comment.body" />
				</div>
			</div>
			<div />
		</div>
	</AppContainer>
</template>
