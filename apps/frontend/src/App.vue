<script setup lang="ts">
import { RouterView } from "vue-router";
import router from "./router";
import { computed, ref, watch } from "vue";
import { useQuery } from "zero-vue";
import { useZero } from "./composables/useZero";

async function goToHome() {
	router.push({ name: "home" });
}

defineShortcuts({
	"g-d": goToHome,
	meta_k: {
		handler: () => {
			open.value = !open.value;
		},
		usingInput: true,
	},
});

const z = useZero();
const { data: repos } = useQuery(() => z.value.query.reposTable);

const open = ref(false);
watch(open, (open) => {
	if (!open) {
		document.activeElement?.blur();
	}
});

const groups = computed(() => {
	const r = repos.value.map((repo) => {
		return {
			label: `${repo.org}/${repo.name}`,
			suffix: Number.isFinite(repo.stars) ? String(repo.stars) : undefined,
		};
	});

	return [
		{
			id: "repos",
			label: "Repos",
			items: r,
		},
	];
});
</script>

<template>
	<UApp>
		<UModal v-model:open="open">
			<template #content>
				<UCommandPalette
					:groups="groups"
					placeholder="Search users..."
					class="h-80"
				/>
			</template>
		</UModal>
		<router-view v-slot="{ Component }">
			<keep-alive include="HomeView">
				<component :is="Component" />
			</keep-alive>
		</router-view>
	</UApp>
</template>

<style scoped></style>
