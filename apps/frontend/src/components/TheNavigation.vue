<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useColorMode } from "@vueuse/core";

const authStore = useAuthStore();
const mode = useColorMode();
</script>

<template>
	<nav class="flex items-center justify-between w-full p-4">
		<div>
			<router-link :to="{ name: 'home' }">
				<img
					:src="mode === 'dark' ? '/icon-light.svg' : '/icon.svg'"
					alt="Logo"
					class="h-8 w-8"
				/>
			</router-link>
		</div>
		<div class="flex gap-4">
			<ColorModeButton />
			<UButton
				v-if="authStore.jwt"
				icon="mdi:logout"
				color="neutral"
				variant="outline"
				class="self-end"
				@click="authStore.logout"
			>
				Log out
			</UButton>
			<UButton
				v-else
				icon="mdi:github"
				color="neutral"
				class="self-end"
				@click="authStore.login"
			>
				Sign in with Github
			</UButton>
		</div>
	</nav>
</template>
