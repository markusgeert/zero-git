<script setup lang="ts">
import { useQuery } from "zero-vue";
import { useZero } from "@/composables/useZero";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

const z = useZero();
const { data: users } = useQuery(z.value.query.usersTable, {
	ttl: "forever",
});
</script>

<template>
  <Col>
    <UButton
      v-if="authStore.jwt"
      icon="mdi:logout"
      color="neutral"
      variant="outline"
      @click="authStore.logout"
    >
      Log out
    </UButton>
    <UButton v-else icon="mdi:github" color="neutral" @click="authStore.login">
      Sign in with Github
    </UButton>
    <span>{{ users }}</span>
    <span>{{ authStore.jwt }}</span>
    <span>{{ authStore.rawJwt }}</span>
  </Col>
</template>
