<script setup lang="ts">
import { useTableSelector } from "@/composables/useTableSelector";
import { useZero } from "@/composables/useZero";
import { CACHE_AWHILE } from "@/query-cache-policy";
import type { Row } from "@rocicorp/zero";
import { useRouteParams } from "@vueuse/router";
import type { schema } from "@zero-git/zero";
import { useTemplateRef } from "vue";
import { useQuery } from "zero-vue";

type PRRow = Row<typeof schema.tables.pullRequestsTable>;
type GithubUsersRow = Row<typeof schema.tables.githubUsersTable>;

const repoName = useRouteParams<string>("repo");
const orgName = useRouteParams<string>("org");

const z = useZero();
const { data: repo } = useQuery(
	() =>
		z.value.query.reposTable
			.where("name", repoName.value || "")
			.whereExists("org", (q) => q.where("name", orgName.value || ""))
			.one(),
	CACHE_AWHILE,
);

const { data: prs, status } = useQuery(
	() =>
		z.value.query.pullRequestsTable
			.where("repoId", repo.value?.id ?? "")
			.where("state", "open")
			.related("creator")
			.orderBy("createdAt", "desc"),
	CACHE_AWHILE,
);

function formatRelativeDate(date?: string | number | null) {
	if (!date) {
		return;
	}

	const now = new Date();
	const seconds = Math.floor((+now - +new Date(date)) / 1000);

	const intervals = {
		year: 31536000,
		month: 2592000,
		week: 604800,
		day: 86400,
		hour: 3600,
		minute: 60,
		second: 1,
	};

	let interval;

	for (const [key, value] of Object.entries(intervals)) {
		interval = Math.floor(seconds / value);
		if (interval >= 1) {
			if (key === "year") {
				return interval + " year" + (interval === 1 ? "" : "s") + " ago";
			} else if (key === "month") {
				if (interval === 1) return "last month";
				return interval + " months ago";
			} else if (key === "week") {
				if (interval === 1) return "last week";
				return interval + " weeks ago";
			} else if (key === "day") {
				if (interval === 1) return "yesterday";
				return interval + " days ago";
			} else if (key === "hour") {
				return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
			} else if (key === "minute") {
				return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
			} else if (key === "second") {
				return interval + " second" + (interval === 1 ? "" : "s") + " ago";
			}
		}
	}

	// If it's more than a month, or a specific date format is desired
	const dateObj = new Date(date);
	const monthNames = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	const month = monthNames[dateObj.getMonth()];
	const day = dateObj.getDate();
	const year = dateObj.getFullYear();

	if (now.getFullYear() === year) {
		// Same year, format as "Mar 25"
		return `on ${month} ${day}`;
	} else {
		// Different year, format as "Dec 9, 2019"
		return `on ${month} ${day}, ${year}`;
	}
}

function getIcon(state: string) {
	switch (state) {
		case "open":
			return "i-lucide-git-pull-request-arrow";
		case "closed":
			return "i-lucide-git-pull-request-closed";
		case "merged":
			return "i-proicons-branch";
		case "draft":
			return "i-lucide-git-pull-request-draft";
		default:
			return "i-lucide-git-pull-request";
	}
}

function getPrText(pr: PRRow & { org?: GithubUsersRow }) {
	if (pr.state === "open" || pr.state === "draft") {
		return `#${pr.number} opened ${formatRelativeDate(pr.createdAt)} by ${pr.org?.name}`;
	}

	if (pr.state === "closed") {
		return `#${pr.number} by ${pr.org?.name} was closed ${formatRelativeDate(pr.content?.closed_at)}`;
	}

	if (pr.state === "merged") {
		return `#${pr.number} by ${pr.org?.name} was merged ${formatRelativeDate(pr.content?.merged_at)}`;
	}
}

const table = useTemplateRef("prsTable");
useTableSelector(table, (row) => {
	console.log("navigating to pr", row);
});
</script>

<template>
	<UTable
		v-if="prs.length > 0 || status === 'complete'"
		ref="prsTable"
		:data="prs"
		:columns="[
			{
				id: 'main',
			},
		]"
		:ui="{
			root: 'overflow-visible',
			tbody: '[&>tr]:data-[selectable=true]:hover:bg-unset',
			tr: 'data-[selected=true]:bg-unset data-[focused=hover]:bg-(--ui-bg-elevated)/50 data-[focused=focus]:bg-(--ui-bg-elevated)/50  data-[focused=focus]:outline',
			td: 'data-[selectable=true]:hover:bg-unset focus-visible:outline-none text-base',
		}"
	>
		<template #main-cell="{ row: { original: pr } }">
			<div class="flex items-center gap-3">
				<UIcon :name="getIcon(pr.state)" />
				<div class="flex flex-col">
					<h3 class="font-semibold">{{ pr.title }}</h3>
					<div class="flex text-sm">
						<span>
							{{ getPrText(pr) }}
						</span>
						<span v-if="pr.state === 'draft'"> • Draft </span>
					</div>
				</div>
			</div>
		</template>
	</UTable>
</template>
