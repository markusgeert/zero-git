<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import type { TableColumn } from "@nuxt/ui";
import type { Repo } from "@/stores/repoStore";
import { useZero } from "@/composables/useZero";
import { useQuery } from "zero-vue";
import { computed, ref, useTemplateRef, watch } from "vue";
import { recordPageLoad } from "@/page-load-stats";
import { CACHE_FOREVER } from "@/query-cache-policy";
import { useFuse } from "@vueuse/integrations/useFuse";

const authStore = useAuthStore();

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
	escape: {
		usingInput: true,
		handler: () => {
			searchEl.value?.inputRef?.blur();
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
	<Col>
		<UButton
			v-if="authStore.jwt"
			icon="mdi:logout"
			color="neutral"
			variant="outline"
			class="self-end"
			@click="authStore.logout"
		>
			Log out
		</UButton>
		<UButton
			v-else
			icon="mdi:github"
			color="neutral"
			class="self-end"
			@click="authStore.login"
		>
			Sign in with Github
		</UButton>
		<UInput
			ref="search-el"
			v-model="searchInput"
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
	</Col>
</template>
