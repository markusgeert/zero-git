<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Repo } from "@/stores/repoStore";
import { useZero } from "@/composables/useZero";
import { useQuery } from "zero-vue";
import { resolveComponent, computed, h, ref, useTemplateRef, watch } from "vue";
import { recordPageLoad } from "@/page-load-stats";
import { CACHE_FOREVER } from "@/query-cache-policy";
import { useFuse } from "@vueuse/integrations/useFuse";
import AppContainer from "@/components/AppContainer.vue";
import type { Column } from "@tanstack/table-core";

const UButton = resolveComponent("UButton");

const columns: TableColumn<Repo>[] = [
	{
		accessorKey: "id",
		header: "ID",
		size: 250,
	},
	{
		// accessorFn: (row) => row.org?.name,
		header: ({ column }) => getHeader(column, "Org"),
		accessorKey: "org.name",
		size: 250,
	},
	{
		accessorKey: "name",
		header: ({ column }) => getHeader(column, "Repo"),
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

function getHeader(column: Column<Repo>, label: string) {
	const isSorted = column.getIsSorted();

	return h(UButton, {
		color: "neutral",
		variant: "ghost",
		label,
		icon: isSorted
			? isSorted === "asc"
				? "i-lucide-arrow-up-narrow-wide"
				: "i-lucide-arrow-down-wide-narrow"
			: "i-lucide-arrow-up-down",
		class: "-mx-2.5",
		onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
	});
}

const { results } = useFuse(searchInput, repos, {
	matchAllWhenSearchEmpty: true,
	fuseOptions: { keys: ["org.name", "name"] },
});

const filteredRepos = computed(() => results.value.map((r) => r.item));

const sorting = ref([]);
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
			v-model:sorting="sorting"
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
