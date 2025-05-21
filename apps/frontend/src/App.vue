<script setup lang="ts">
import { RouterView } from "vue-router";
import router from "./router";
import { computed, ref, watch } from "vue";
import { useQuery } from "zero-vue";
import { useZero } from "./composables/useZero";
import { useFavicon } from "@vueuse/core";
import { useRouteParams } from "@vueuse/router";

const orgName = useRouteParams<string>("org");

async function goToHome() {
	router.push({ name: "home" });
}

async function goToOrg() {
	if (orgName) {
		router.push({ name: "org", params: { org: orgName.value } });
		return;
	}
}

defineShortcuts({
	"g-d": goToHome,
	"g-o": goToOrg,
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

if (import.meta.env.DEV) {
	const icon = useFavicon();
	icon.value = "/icon-dev.svg";
}
</script>

<template>
	<UApp>
		<UModal v-model:open="open">
			<template #content>
				<UCommandPalette
					:groups="groups"
					placeholder="Search repos..."
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
			<TheNavigation />
			<keep-alive include="HomeView">
				<component :is="Component" />
			</keep-alive>
		</router-view>
	</UApp>
</template>

<style scoped></style>
