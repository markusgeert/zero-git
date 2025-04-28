<script setup lang="ts">
import { useZero } from "@/composables/useZero";
import router from "@/router";
import type { NavigationMenuItem } from "@nuxt/ui";
import { useRouteParams } from "@vueuse/router";
import { ref } from "vue";
import { useQuery } from "zero-vue";

const orgName = useRouteParams<string>("org");
const repoName = useRouteParams<string>("repo");

const z = useZero();
const { data: repo } = useQuery(() =>
	z.value.query.reposTable
		.where("org", orgName.value)
		.where("name", repoName.value)
		.one(),
);

const items = ref<NavigationMenuItem[]>([
	[
		{
			label: "Code",
			icon: "i-lucide-code-xml",
			to: { name: "code" },
		},
		{
			label: "Issues",
			icon: "i-lucide-circle-dot",
			to: "issues",
		},
		{
			label: "Pull requests",
			icon: "i-lucide-git-pull-request-arrow",
			to: "pulls",
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
	<div v-if="repo">{{ repo.org }}/{{ repo.name }}</div>
	<UNavigationMenu :items="items" class="w-full" />
	<router-view v-slot="{ Component }">
		<keep-alive>
			<component :is="Component" />
		</keep-alive>
	</router-view>
</template>
