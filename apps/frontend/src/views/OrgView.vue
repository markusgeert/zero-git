<script setup lang="ts">
import { useZero } from "@/composables/useZero";
import { recordPageLoad } from "@/page-load-stats";
import { CACHE_FOREVER } from "@/query-cache-policy";
import { useRouteParams } from "@vueuse/router";
import { watch } from "vue";
import { useQuery } from "zero-vue";

const org = useRouteParams("org");

const z = useZero();
const { data: repos, status } = useQuery(
	() =>
		z.value.query.reposTable
			.whereExists("org", (q) => q.where("name", org.value as string))
			.related("org"),
	CACHE_FOREVER,
);

watch(status, (s) => {
	if (s === "complete") {
		recordPageLoad("org-view");
	}
});
</script>

<template>
	<AppContainer class="pt-4">
		<AppReposList :repos :status />
	</AppContainer>
</template>
