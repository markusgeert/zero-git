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
    <UButton v-else icon="mdi:github" color="neutral" @click="authStore.login" class="self-end">
      Sign in with Github
    </UButton>
    <UButton icon="mdi:plus" color="neutral" @click="addRepo" class="self-end">
        Add repo
    </UButton>
    {{ repos }}
    <span v-for="repo in repos">
      {{ repo.id }}
    </span>
    <!-- <UTable :data="repos" :columns class="flex-1"         @select="onSelect" /> -->
  </Col>
</template>
