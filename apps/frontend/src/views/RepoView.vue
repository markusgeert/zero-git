<script setup lang="ts">
import { useZero } from "@/composables/useZero";
import { CACHE_AWHILE } from "@/query-cache-policy";
import router from "@/router";
import type { NavigationMenuItem } from "@nuxt/ui";
import { useTitle } from "@vueuse/core";
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

const title = useTitle();

watch(
	[orgName, repoName],
	([orgName, repoName]) => {
		title.value = `${orgName}/${repoName} - commit.zone`;
	},
	{ immediate: true },
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
		params: {
			org: orgName.value,
			repo: repoName.value,
		},
	});
}

async function goToIssues() {
	await router.push({
		name: "issues",
		params: {
			org: orgName.value,
			repo: repoName.value,
		},
	});
}

async function goToPullRequests() {
	await router.push({
		name: "pull-requests",
		params: {
			org: orgName.value,
			repo: repoName.value,
		},
	});
}

defineShortcuts({
	"g-c": goToCode,
	"g-i": goToIssues,
	"g-p": goToPullRequests,
});
</script>

<template>
	<UNavigationMenu
		:items="items"
		variant="link"
		class="w-full border-b border-default px-3 md:px-4 lg:px-5"
	>
		<template #item-leading="{ item }">
			<UTooltip :text="item.label">
				<UIcon
					:name="item.icon || ''"
					class="text-dimmed group-hover:text-default size-5 shrink-0 transition-colors"
				/>
			</UTooltip>
		</template>
	</UNavigationMenu>
	<AppContainer class="gap-2 py-2">
		<router-view v-slot="{ Component }">
			<keep-alive>
				<component :is="Component" />
			</keep-alive>
		</router-view>
	</AppContainer>
</template>
