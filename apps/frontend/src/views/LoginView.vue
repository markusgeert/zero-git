<script setup lang="ts">
import { createClient } from "@openauthjs/openauth/client";

async function handleLogin() {
	const client = createClient({
		clientID: import.meta.env.VITE_OPENAUTH_CLIENT_ID,
		issuer: import.meta.env.VITE_OPENAUTH_ISSUER_URL,
	});

	const redirect_uri = `${window.location.origin}/login/callback`;
	const { url } = await client.authorize(redirect_uri, "code");

	window.location.href = url;

	// const tokens = await client.exchange(query.get("code"), redirect_uri)
	// const verified = await client.verify(subjects, tokens.access)
}
</script>

<template>
  <UButton
    color="neutral"
    @click="handleLogin"
  >
      <template #leading>
        <UIcon name="mdi:github" class="size-5" />
      </template>
      Sign in with Github
  </UButton>
</template>
