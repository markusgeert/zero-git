<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import type { TableColumn, TableRow } from "@nuxt/ui";
import { nanoid } from "nanoid";
import { faker } from "@faker-js/faker";
import { useRepoStore, type Repo } from "@/stores/repoStore";
import { useZero } from "@/composables/useZero";
import { ref } from "vue";

console.time("HomeView");

const authStore = useAuthStore();
const repoStore = useRepoStore();

const columns: TableColumn<Repo>[] = [
	{
		accessorKey: "id",
		header: "ID",
	},
	{
		accessorKey: "org",
		header: "Org",
	},
	{
		accessorKey: "name",
		header: "Repo",
	},
	{
		accessorKey: "visibility",
		header: "visibility",
	},
];

async function addRepo() {
	const z = useZero();
	await z.value.mutate.reposTable.insert({
		id: nanoid(),
		visibility: "public",
		stars: faker.number.int({ min: 0, max: 100 }),
		org: faker.internet.username(),
		name: faker.git.branch(),
	});
}

function onSelect(row: TableRow<Repo>, e?: Event) {
	console.log(row, e);
}

const focusedRow = ref();
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
		<ItemList
			v-model:focused-row="focusedRow"
			:data="repoStore.repos"
			:columns="columns"
			:get-link="(r) => repoStore.repoLinks[r.original.id]"
			:ui="{
				tbody: '[&>tr]:data-[selectable=true]:hover:bg-unset',
				tr: 'data-[selected=true]:bg-unset data-[focused=hover]:bg-(--ui-bg-elevated)/50 data-[focused=focus]:bg-(--ui-bg-elevated)/50  data-[focused=focus]:outline',
				td: 'data-[selectable=true]:hover:bg-unset focus-visible:outline-none',
			}"
			@select="onSelect"
		/>
	</Col>
</template>
