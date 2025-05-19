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
	ctrl_c: {
		handler: () => {
			open.value = false;
		},
		usingInput: true,
	},
});

const z = useZero();
const { data: repos } = useQuery(() => z.value.query.reposTable.related("org"));

const open = ref(false);
watch(open, (open) => {
	if (!open) {
		(document.activeElement as HTMLElement)?.blur();
	}
});

const groups = computed(() => {
	const r = repos.value.map((repo) => {
		return {
			label: `${repo.org?.name}/${repo.name}`,
			suffix: Number.isFinite(repo.stars) ? String(repo.stars) : undefined,
			to: `/${repo.org?.name}/${repo.name}`,
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
					@update:model-value="
						(entry) => {
							if (entry) {
								open = false;
							}
						}
					"
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
