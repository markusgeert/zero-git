<script setup lang="ts">
import { useZero } from "@/composables/useZero";
import type { TableColumn } from "@nuxt/ui";
import { h, resolveComponent } from "vue";
import { useQuery } from "zero-vue";

const z = useZero();
const { data: repos } = useQuery(z.value.query.reposTable, {
	ttl: "forever",
});

const UAvatar = resolveComponent("UAvatar");
// const columns: TableColumn<(typeof repos)["value"][0]>[] = [
//   {
//     accessorKey: "githubAvatarUrl",
//     header: "",
//     cell: ({ row }) => {
//       return h(UAvatar, { src: row.getValue("githubAvatarUrl") });
//     },
//   },
//   {
//     accessorKey: "email",
//     header: "Email",
//   },
// ];
</script>

<template>
	<UTable :data="[...repos]" class="flex-1" />
</template>
