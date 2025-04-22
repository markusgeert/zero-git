<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { useQuery } from "zero-vue";
import { useZero } from "@/composables/useZero";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

const z = useZero();
const { data: repos } = useQuery(z.value.query.reposTable);

const columns: TableColumn<(typeof repos)["value"][0]>[] = [
    {
        accessorKey: "id",
        header: "ID",
    },
]
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
    <!-- <UTable :data="[...users]" :columns class="flex-1" /> -->
    <UTable :data="repos" :columns class="flex-1" />
  </Col>
</template>
