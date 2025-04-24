<script setup lang="ts">
import { useZero } from "@/composables/useZero";
import { useRouteParams } from "@vueuse/router";
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
</script>

<template>
	<div>
		{{ repo?.id }}
	</div>
</template>
