<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
</script>

<template>
  <UButton
    color="neutral"
    @click="authStore.login"
  >
      <template #leading>
        <UIcon name="mdi:github" class="size-5" />
      </template>
      Sign in with Github
  </UButton>
</template>
