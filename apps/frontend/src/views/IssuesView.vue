<script setup lang="ts">
import { useTableSelector } from "@/composables/useTableSelector";
import { useZero } from "@/composables/useZero";
import { CACHE_AWHILE } from "@/query-cache-policy";
import type { Row } from "@rocicorp/zero";
import { useRouteParams } from "@vueuse/router";
import type { schema } from "@zero-git/zero";
import { ref, useTemplateRef } from "vue";
import { useQuery } from "zero-vue";
import { useFuse } from "@vueuse/integrations/useFuse";
import { useRouter } from "vue-router";
import posthog from "posthog-js";
import type { Table } from "@tanstack/vue-table";

type IssueRow = Row<typeof schema.tables.issuesTable>;
type GithubUsersRow = Row<typeof schema.tables.githubUsersTable>;
type IssueWithAuthor = IssueRow & { author?: GithubUsersRow };

const repoName = useRouteParams<string>("repo");
const orgName = useRouteParams<string>("org");

const router = useRouter();

const z = useZero();
const { data: repo } = useQuery(
	() =>
		z.value.query.reposTable
			.where("name", repoName.value || "")
			.whereExists("org", (q) => q.where("name", orgName.value || ""))
			.one(),
	CACHE_AWHILE,
);

const { data: issues, status } = useQuery(
	() =>
		z.value.query.issuesTable
			.where("repoId", repo.value?.id ?? "")
			.where("prNumber", "!=", true)
			.where("state", "open")
			.related("author")
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
		return `on ${month} ${day}`;
	} else {
		return `on ${month} ${day}, ${year}`;
	}
}

const icons = {
	open: { icon: "i-lucide-circle-dot", class: "text-green-500" },
	closed: { icon: "i-lucide-check-circle", class: "text-red-500" },
	default: { icon: "i-lucide-circle", class: "text-zinc-400" },
};

function getIssueIcon(issue: IssueRow) {
	if (issue.state === "open") {
		return icons.open;
	}

	if (issue.state === "closed") {
		return icons.closed;
	}

	return icons.default;
}

function getIssueText(issue: IssueRow & { author?: GithubUsersRow }) {
	if (issue.state === "open") {
		return `#${issue.number} opened ${formatRelativeDate(issue.createdAt)} by ${issue.author?.name}`;
	}

	if (issue.state === "closed") {
		return `#${issue.number} by ${issue.author?.name} was closed ${formatRelativeDate(issue.content?.closed_at)}`;
	}
}

const table = useTemplateRef<{
	tableRef?: HTMLTableElement;
	tableApi?: Table<IssueRow>;
}>("issuesTable");

const { handleRowHover } = useTableSelector(table);

const searchInput = ref("");
const searchEl = useTemplateRef("search-el");

defineShortcuts({
	"/": () => {
		searchEl.value?.inputRef?.focus();
	},
	ctrl_c: {
		usingInput: "search-el",
		handler: () => {
			searchEl.value?.inputRef?.blur();
		},
	},
	escape: {
		usingInput: "search-el",
		handler: () => {
			searchEl.value?.inputRef?.blur();
		},
	},
	enter: {
		usingInput: "search-el",
		handler: () => {
			const firstLink = document.querySelector("tbody a");
			if (firstLink instanceof HTMLAnchorElement) {
				firstLink.focus();
			}
		},
	},
});

const { results: filteredIssues } = useFuse<IssueWithAuthor>(
	searchInput,
	issues,
	{
		matchAllWhenSearchEmpty: true,
		fuseOptions: { keys: ["title", "body", "number", "author.name"] },
	},
);

function isPrimaryMouseButton(e: MouseEvent) {
	return !(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button !== 0);
}

const availableFilters = ref([
	{
		label: "Author",
		value: "author",
		icon: "i-lucide-user",
		options: [
			{
				label: "Kenda",
				sublabel: "1 issue",
				value: "1",
			},
			{
				label: "Carrell",
				sublabel: "5 issues",
				value: "2",
			},
		],
	},
	{
		label: "Labels",
		value: "labels",
		icon: "i-lucide-tags",
		options: [
			{
				label: "bug",
				sublabel: "3 issues",
				value: "bug",
			},
			{
				label: "enhancement",
				value: "enhancement",
			},
			{
				label: "question",
				value: "question",
			},
		],
	},
]);
</script>

<template>
	<AppContainer class="flex flex-col gap-4 pt-4">
		<div class="flex">
			<AppFilter
				v-if="posthog.isFeatureEnabled('issue-filters')"
				:available-filters="availableFilters"
			/>
			<UInput
				ref="search-el"
				v-model="searchInput"
				name="search-el"
				icon="i-lucide-search"
				size="md"
				variant="outline"
				class="self-start"
			/>
		</div>
		<UTable
			v-if="issues.length > 0 || status === 'complete'"
			ref="issuesTable"
			class="issues-table"
			:data="filteredIssues"
			:columns="[
				{
					id: 'main',
				},
			]"
			:ui="{
				root: 'overflow-visible group',
				base: 'overflow-auto',
				tbody: '[&>tr]:data-[selectable=true]:hover:bg-unset',
				thead: 'hidden',
				tr: 'data-[selected=true]:bg-unset data-[focused=hover]:bg-(--ui-bg-elevated)/50 data-[focused=focus]:bg-(--ui-bg-elevated)/50',
				td: 'data-[selectable=true]:hover:bg-unset focus-visible:outline-none text-base p-0',
			}"
		>
			<template
				#main-cell="{
					row: {
						original: { item: issue },
					},
					row,
				}"
			>
				<router-link
					:to="`/${orgName}/${repoName}/issues/${issue.number}`"
					class="row flex p-2"
					:tabindex="0"
					@focus="handleRowHover(row, $event)"
					@mousedown="
						if (isPrimaryMouseButton($event)) {
							$event.preventDefault();
							router.push(`/${orgName}/${repoName}/issues/${issue.number}`);
						}
					"
				>
					<div class="flex items-center gap-2">
						<UIcon
							:name="getIssueIcon(issue).icon"
							:class="getIssueIcon(issue).class"
							class="self-start"
						/>
						<div class="flex flex-col">
							<h3 class="font-semibold text-default">{{ issue.title }}</h3>
							<div class="flex gap-1 text-xs">
								<span>
									{{ getIssueText(issue) }}
								</span>
							</div>
						</div>
					</div>
				</router-link>
			</template>
		</UTable>
	</AppContainer>
</template>

<style scoped>
.issues-table tr:not([data-focused="focus"]) .row:focus-visible {
	outline: none;
}
</style>
