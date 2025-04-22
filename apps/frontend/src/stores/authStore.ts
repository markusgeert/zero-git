import { createClient } from "@openauthjs/openauth/client";
import { defineStore } from "pinia";
import { ref, watchEffect } from "vue";

const client = createClient({
	clientID: import.meta.env.VITE_OPENAUTH_CLIENT_ID,
	issuer: import.meta.env.VITE_OPENAUTH_ISSUER_URL,
});

export const useAuthStore = defineStore("auth", () => {
	const initializing = ref(true);
	const loaded = ref(false);
	const loggedIn = ref(false);
	const token = ref<string | undefined>(undefined);
	const userId = ref<string | undefined>();

	watchEffect(() => {
		const hash = new URLSearchParams(location.search.slice(1));
		const code = hash.get("code");
		const state = hash.get("state");

		if (!initializing) {
			return;
		}

		initializing.value = false;

		if (code && state) {
			callback(code, state);
			return;
		}

		auth();
	});

	async function auth() {
		const token = await refreshTokens();

		if (token) {
			await user();
		}

		loaded.value = true;
	}

	async function refreshTokens() {
		const refresh = localStorage.getItem("refresh");
		if (!refresh) return;
		const next = await client.refresh(refresh, {
			access: token.value,
		});
		if (next.err) return;
		if (!next.tokens) return token.value;

		localStorage.setItem("refresh", next.tokens.refresh);
		token.value = next.tokens.access;

		return next.tokens.access;
	}

	async function getToken() {
		const token = await refreshTokens();

		if (!token) {
			await login();
			return;
		}

		return token;
	}

	async function login() {
		const { challenge, url } = await client.authorize(location.origin, "code", {
			pkce: true,
		});
		sessionStorage.setItem("challenge", JSON.stringify(challenge));
		location.href = url;
	}

	async function callback(code: string, state: string) {
		const challengeInStore = sessionStorage.getItem("challenge");
		if (!challengeInStore) {
			throw new Error("Challenge not found");
		}

		const challenge = JSON.parse(challengeInStore);
		if (code) {
			if (state === challenge.state && challenge.verifier) {
				const exchanged = await client.exchange(
					code,
					location.origin,
					challenge.verifier,
				);
				if (!exchanged.err) {
					token.value = exchanged.tokens?.access;
					localStorage.setItem("refresh", exchanged.tokens.refresh);
				}
			}
			window.location.replace("/");
		}
	}

	async function user() {
		const res = await fetch("http://localhost:9377/", {
			headers: {
				Authorization: `Bearer ${token.value}`,
			},
		});

		if (res.ok) {
			userId.value = await res.text();
			loggedIn.value = true;
		}
	}

	function logout() {
		localStorage.removeItem("refresh");
		token.value = undefined;

		window.location.replace("/");
	}

	return { login, logout, userId, loaded, loggedIn, getToken };
});
