<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import type { BreadcrumbItem } from "@nuxt/ui";
import { useColorMode } from "@vueuse/core";
import { useRouteParams } from "@vueuse/router";
import { computed } from "vue";
import { useRoute } from "vue-router";

const authStore = useAuthStore();
const mode = useColorMode();

const repoName = useRouteParams<string>("repo");
const orgName = useRouteParams<string>("org");

const route = useRoute();

const breadcrumbs = computed(() => {
	const items: BreadcrumbItem[] = [];

	if (orgName.value) {
		items.push({
			label: orgName.value,
			to: { name: "org", params: { org: orgName.value } },
		});
	}

	if (repoName.value) {
		items.push({
			label: repoName.value,
			to: {
				name: "repo",
				params: { org: orgName.value, repo: repoName.value },
			},
		});
	}

	if (route.name === "home") {
		items.push({
			label: "Dashboard",
			to: { name: "home" },
		});
	}

	return items;
});
</script>

<template>
	<nav class="flex items-center justify-between w-full p-4 pb-0">
		<div class="flex items-center gap-4">
			<router-link :to="{ name: 'home' }">
				<img
					:src="mode === 'dark' ? '/icon-light.svg' : '/icon.svg'"
					alt="Logo"
					class="h-8 w-8"
				/>
			</router-link>
			<UBreadcrumb :items="breadcrumbs">
				<template #separator>
					<span class="mx-2 text-muted">/</span>
				</template>
			</UBreadcrumb>
		</div>
		<div class="flex gap-4">
			<ColorModeButton />
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
		</div>
	</nav>
</template>
