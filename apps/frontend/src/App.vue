<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
	<UApp>
		<router-view v-slot="{ Component }">
			<keep-alive include="HomeView">
				<component :is="Component" />
			</keep-alive>
		</router-view>
	</UApp>
</template>

<style scoped></style>
