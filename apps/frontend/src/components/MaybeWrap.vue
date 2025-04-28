<script setup lang="ts">
import { type Component } from "vue";

const props = defineProps<{
	in: Component;
	shouldWrap: unknown;
}>();
</script>

<template>
	<component :is="props.in" v-if="Boolean(shouldWrap)" v-bind="$attrs">
		<slot />
	</component>
	<slot v-else />
</template>
