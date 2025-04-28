<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useRouteHash } from "@vueuse/router";
import { watch } from "vue";

const authStore = useAuthStore();
const hash = useRouteHash();

watch(
	hash,
	(hash) => {
		if (hash) {
			authStore.callback(hash);
			return;
		}

		authStore.auth();
	},
	{ immediate: true },
);
</script>

<template>
	<div />
</template>
