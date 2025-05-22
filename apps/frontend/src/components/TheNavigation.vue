<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import type { BreadcrumbItem } from "@nuxt/ui";
import { useColorMode } from "@vueuse/core";
import { useRouteParams } from "@vueuse/router";
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppLogo from "@/assets/logo.svg";
import { useZero } from "@/composables/useZero";
import { useQuery } from "zero-vue";
import { CACHE_AWHILE } from "@/query-cache-policy";
import type { DropdownMenuItem } from "@nuxt/ui";

const authStore = useAuthStore();
const mode = useColorMode();
const zero = useZero();

const repoName = useRouteParams<string>("repo");
const orgName = useRouteParams<string>("org");

const route = useRoute();

const { data: user } = useQuery(
	() =>
		zero.value.query.usersTable
			.where("id", authStore.jwt?.properties.id ?? "")
			.one(),
	CACHE_AWHILE,
);

const dropdownItems = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: user.value?.githubName || user.value?.email || "User",
			avatar: user.value?.githubAvatarUrl
				? {
						src: user.value.githubAvatarUrl,
					}
				: undefined,
			type: "label",
		},
	],
	[
		{
			label: "Logout",
			icon: "i-lucide-log-out",
			onSelect: () => authStore.logout(),
		},
	],
]);

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
				<AppLogo
					class="logo"
					:class="mode === 'dark' ? 'logo-dark' : 'logo-light'"
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
			<template v-if="authStore.jwt">
				<UDropdownMenu
					:items="dropdownItems"
					:ui="{
						content: 'w-48',
					}"
				>
					<div>
						<img
							v-if="user?.githubAvatarUrl"
							:src="user.githubAvatarUrl"
							alt="Profile"
							class="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-primary transition-all"
						/>
					</div>
				</UDropdownMenu>
			</template>
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

<style>
.logo path {
	fill: var(--ui-text);
}

.logo {
	transform: rotate(0deg);
	transition: transform 0 ease-in-out 0;
}

.logo:hover {
	transform: rotate(360deg);
	transition-duration: 0.3s;
	transition-delay: 2s;
}
</style>
