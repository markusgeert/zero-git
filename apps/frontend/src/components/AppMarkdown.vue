<template>
	<!-- eslint-disable-next-line vue/no-v-html -->
	<div class="markdown-body" v-html="sanitizedHtml"></div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";

const props = defineProps<{
	md: string;
}>();

const sanitizedHtml = computed(() => {
	return DOMPurify.sanitize(marked.parse(props.md, { async: false }));
});
</script>
