<script setup lang="ts">
import { recordPageLoad } from "@/page-load-stats";
// import { ref } from "vue";

// const items = ref([
// {
// 	label: "app/",
// 	defaultExpanded: true,
// 	children: [
// 		{
// 			label: "composables/",
// 			children: [
// 				{
// 					label: "useAuth.ts",
// 					icon: "i-vscode-icons-file-type-typescript",
// 				},
// 				{
// 					label: "useUser.ts",
// 					icon: "i-vscode-icons-file-type-typescript",
// 				},
// 			],
// 		},
// 		{
// 			label: "components/",
// 			defaultExpanded: true,
// 			children: [
// 				{
// 					label: "Card.vue",
// 					icon: "i-vscode-icons-file-type-vue",
// 				},
// 				{
// 					label: "Button.vue",
// 					icon: "i-vscode-icons-file-type-vue",
// 				},
// 			],
// 		},
// 	],
// },
// {
// 	label: "app.vue",
// 	icon: "i-vscode-icons-file-type-vue",
// },
// {
// 	label: "nuxt.config.ts",
// 	icon: "i-vscode-icons-file-type-nuxt",
// },
// ]);

recordPageLoad("code-view");
</script>

<template>
	<!-- <UTree :items="items" /> -->
	<div>Code will be here</div>
</template>
