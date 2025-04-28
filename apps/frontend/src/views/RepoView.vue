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
const { data: org } = useQuery(() =>
	z.value.query.organizationsTable
		.where("name", orgName.value)
		.related("repos", (q) => q.where("name", repoName.value).one())
		.one(),
);

const items = ref<NavigationMenuItem[]>([
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
	<div v-if="org">{{ org.name }}/{{ org.repos?.name }}</div>
	<router-link :to="{ name: 'home' }">
		<button class="btn btn-primary">Go to home</button>
	</router-link>
	<UNavigationMenu :items="items" variant="link" class="w-full" />
	<router-view v-slot="{ Component }">
		<keep-alive>
			<component :is="Component" />
		</keep-alive>
	</router-view>
</template>
