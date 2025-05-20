<script setup lang="ts">
import { useZero } from "@/composables/useZero";
import { CACHE_AWHILE } from "@/query-cache-policy";
import router from "@/router";
import type { NavigationMenuItem } from "@nuxt/ui";
import { useRouteParams } from "@vueuse/router";
import { computed, watch } from "vue";
import { useQuery } from "zero-vue";

const orgName = useRouteParams<string>("org");
const repoName = useRouteParams<string>("repo");

const z = useZero();
const { data: org, status } = useQuery(
	() =>
		z.value.query.githubUsersTable
			.where("name", orgName.value)
			.related("repos", (q) => q.where("name", repoName.value).one())
			.one(),
	CACHE_AWHILE,
);

watch(status, (s) => {
	if (s === "complete" && !org.value?.repos) {
		router.push({ name: "not-found" });
	}
});

const items = computed<NavigationMenuItem[]>(() => [
	[
		{
			label: "Code",
			icon: "i-lucide-code-xml",
			to: { name: "code" },
			exact: true,
		},
		{
			label: "Issues",
			icon: "i-lucide-circle-dot",
			to: { name: "issues" },
		},
		{
			label: "Pull requests",
			icon: "i-lucide-git-pull-request-arrow",
			to: { name: "pull-requests" },
		},
	],
]);

async function goToCode() {
	await router.push({
		name: "code",
	});
}

async function goToIssues() {
	await router.push({
		name: "issues",
	});
}

async function goToPullRequests() {
	await router.push({
		name: "pull-requests",
	});
}

defineShortcuts({
	"g-c": goToCode,
	"g-i": goToIssues,
	"g-p": goToPullRequests,
});
</script>

<template>
	<div class="max-w-7xl mx-auto px-3 md:px-4 lg:px-5">
		<UNavigationMenu :items="items" variant="link" class="w-full" />
		<router-view v-slot="{ Component }">
			<keep-alive>
				<component :is="Component" />
			</keep-alive>
		</router-view>
	</div>
</template>
