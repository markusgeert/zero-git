<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Repo } from "@/stores/repoStore";
import { useZero } from "@/composables/useZero";
import { useQuery } from "zero-vue";
import { computed, ref, useTemplateRef, watch } from "vue";
import { recordPageLoad } from "@/page-load-stats";
import { CACHE_FOREVER } from "@/query-cache-policy";
import { useFuse } from "@vueuse/integrations/useFuse";
import AppContainer from "@/components/AppContainer.vue";

const columns: TableColumn<Repo>[] = [
	{
		accessorKey: "id",
		header: "ID",
		size: 250,
	},
	{
		accessorFn: (row) => row.org?.name,
		header: "Org",
		size: 250,
	},
	{
		accessorKey: "name",
		header: "Repo",
		size: 200,
	},
	{
		accessorKey: "visibility",
		header: "visibility",
	},
];

const z = useZero();
const { data: repos, status } = useQuery(
	() => z.value.query.reposTable.related("org"),
	CACHE_FOREVER,
);

watch(status, (s) => {
	if (s === "complete") {
		recordPageLoad("list-page");
	}
});

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

const { results } = useFuse(searchInput, repos, {
	matchAllWhenSearchEmpty: true,
	fuseOptions: { keys: ["org.name", "name"] },
});

const filteredRepos = computed(() => results.value.map((r) => r.item));
</script>

<template>
	<AppContainer class="pt-4">
		<UInput
			ref="search-el"
			v-model="searchInput"
			name="search-el"
			icon="i-lucide-search"
			size="md"
			variant="outline"
			class="self-start"
		/>
		<ItemList
			v-if="repos.length > 0 || status === 'complete'"
			:data="filteredRepos"
			:columns="columns"
			:get-link="(r) => `/${r.original.org?.name}/${r.original.name}`"
			:ui="{
				root: 'overflow-visible',
				tbody: '[&>tr]:data-[selectable=true]:hover:bg-unset',
				tr: 'data-[selected=true]:bg-unset data-[focused=hover]:bg-(--ui-bg-elevated)/50 data-[focused=focus]:bg-(--ui-bg-elevated)/50  data-[focused=focus]:outline',
				td: 'data-[selectable=true]:hover:bg-unset focus-visible:outline-none',
			}"
		/>
	</AppContainer>
</template>
