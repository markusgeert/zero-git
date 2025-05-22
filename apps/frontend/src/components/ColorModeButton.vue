<script setup>
import { useColorMode } from "@vueuse/core";
import { ref } from "vue";

const { store } = useColorMode();

const valueToIcon = {
	auto: "i-lucide-monitor",
	light: "i-lucide-sun",
	dark: "i-lucide-moon",
};

const items = ref([
	{
		label: "System",
		value: "auto",
		icon: valueToIcon.auto,
	},
	{
		label: "Light",
		value: "light",
		icon: valueToIcon.light,
	},
	{
		label: "Dark",
		value: "dark",
		icon: valueToIcon.dark,
	},
]);
</script>

<template>
	<USelect
		v-model="store"
		value-key="value"
		:search-input="false"
		:items="items"
		:content="{
			align: 'end',
			position: 'popper',
			positionStrategy: 'absolute',
		}"
		:ui="{
			base: 'p-0 w-8 h-8 flex items-center justify-center transition-none hover:bg-elevated hover:disabled:bg-transparent dark:hover:disabled:bg-transparent hover:aria-disabled:bg-transparent dark:hover:aria-disabled:bg-transparent',
			content: 'w-auto',
			trailing: 'hidden',
		}"
	>
		<template #default="{ modelValue }">
			<UIcon :name="valueToIcon[modelValue]" />
		</template>
	</USelect>
</template>
