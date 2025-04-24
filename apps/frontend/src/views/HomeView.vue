<script setup lang="ts">
import { useZero } from "@/composables/useZero";
import { useAuthStore } from "@/stores/authStore";
import type { TableColumn, TableRow } from "@nuxt/ui";
import { nanoid } from "nanoid";
import { useQuery } from "zero-vue";

const authStore = useAuthStore();

const z = useZero();
const { data: repos } = useQuery(z.value.query.reposTable);

type Repo = (typeof repos)["value"][0];

const columns: TableColumn<Repo>[] = [
	{
		accessorKey: "id",
		header: "ID",
	},
	{
		accessorKey: "visibility",
		header: "visibility",
	},
];

async function addRepo() {
	await z.value.mutate.reposTable.insert({
		id: nanoid(),
		visibility: "public",
	});
}

function onSelect(row: TableRow<Repo>, e?: Event) {
	console.log(row, e);
}
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
			:data="repos"
			:columns="columns"
			:get-link="(row) => `/repo/${row.original.id}`"
			:ui="{
				tbody: '[&>tr]:data-[selectable=true]:hover:bg-unset',
				tr: 'data-[selected=true]:bg-unset data-[focused=hover]:bg-(--ui-bg-elevated)/50 data-[focused=focus]:bg-(--ui-bg-elevated)/50  data-[focused=focus]:outline',
				td: 'data-[selectable=true]:hover:bg-unset focus-visible:outline-none',
			}"
			@select="onSelect"
		/>
	</Col>
</template>
