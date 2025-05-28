<script setup lang="ts">
import { useZero } from "@/composables/useZero";
import { useQuery } from "zero-vue";
import { watch } from "vue";
import { recordPageLoad } from "@/page-load-stats";
import { CACHE_FOREVER } from "@/query-cache-policy";

const z = useZero();
const { data: repos, status } = useQuery(
	() => z.value.query.reposTable.related("org"),
	CACHE_FOREVER,
);

watch(status, (s) => {
	if (s === "complete") {
		recordPageLoad("list-page");
	}
});
</script>

<template>
	<AppContainer class="pt-4">
		<AppReposList :repos :status />
	</AppContainer>
</template>
