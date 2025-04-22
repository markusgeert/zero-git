<script setup lang="ts">
import { useRouteHash } from "@vueuse/router";
import { watch } from "vue";
import { useAuthStore } from "@/stores/authStore";

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

<template></template>
