<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import TheWelcome from "../components/TheWelcome.vue";

const authStore = useAuthStore();
</script>

<template>
  <main>
    <span>{{ authStore.userId }}</span>
    <TheWelcome />
  </main>
</template>
