<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import type { TableColumn } from "@nuxt/ui";
import { nanoid } from "nanoid";
import { faker } from "@faker-js/faker";
import type { Repo } from "@/stores/repoStore";
import { useZero } from "@/composables/useZero";
import { useQuery } from "zero-vue";
import { watch } from "vue";
import { recordPageLoad } from "@/page-load-stats";
import { CACHE_FOREVER } from "@/query-cache-policy";

const authStore = useAuthStore();

const columns: TableColumn<Repo>[] = [
	{
		accessorKey: "id",
		header: "ID",
		size: 250,
	},
	{
		accessorFn: (row) => row.org?.displayName,
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

async function addRepo() {
	z.value.mutate.reposTable.create({
		id: nanoid(),
		orgId: nanoid(),
		orgGithubId: faker.number.int({ min: 1_000_000, max: 9_999_999 }),
		orgName: faker.internet.username(),
		githubId: faker.number.int({ min: 1_000_000, max: 9_999_999 }),
		visibility: "public",
		stars: faker.number.int({ min: 0, max: 100 }),
		name: faker.git.branch(),
	});
}

async function removeRepo() {
	const idxToDelete = faker.number.int({
		min: 0,
		max: repos.value.length - 1,
	});

	await z.value.mutate.reposTable.delete({
		id: repos.value[idxToDelete].id,
	});
}

watch(status, (s) => {
	if (s === "complete") {
		recordPageLoad("list-page");
	}
});

defineShortcuts({
	c: addRepo,
	d: removeRepo,
});
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
		<UButton icon="mdi:plus" color="neutral" class="self-end" @click="addRepo">
			Add repo
		</UButton>
		<span> {{ repos.length }} </span>
		<ItemList
			v-if="repos.length > 0 || status === 'complete'"
			:data="repos"
			:columns="columns"
			:get-link="(r) => `/${r.original.org?.name}/${r.original.name}`"
			:ui="{
				root: 'overflow-visible',
				tbody: '[&>tr]:data-[selectable=true]:hover:bg-unset',
				tr: 'data-[selected=true]:bg-unset data-[focused=hover]:bg-(--ui-bg-elevated)/50 data-[focused=focus]:bg-(--ui-bg-elevated)/50  data-[focused=focus]:outline',
				td: 'data-[selectable=true]:hover:bg-unset focus-visible:outline-none',
			}"
		/>
		<UButton icon="mdi:plus" color="neutral" class="self-end" @click="addRepo">
			Add repo
		</UButton>
	</Col>
</template>
