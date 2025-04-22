import { createClient } from "@openauthjs/openauth/client";
import { useCookies } from "@vueuse/integrations/useCookies";
import type { AuthData } from "@zero-git/auth";
import { defineStore } from "pinia";
import { computed } from "vue";

const client = createClient({
	clientID: import.meta.env.VITE_OPENAUTH_CLIENT_ID,
	issuer: import.meta.env.VITE_OPENAUTH_ISSUER_URL,
});

const cookies = useCookies();
export const useAuthStore = defineStore("auth", () => {
	const rawJwt = computed<string | undefined>(() => {
		return cookies.get("jwt");
	});
	const jwt = computed<AuthData | undefined>(() =>
		rawJwt.value ? JSON.parse(atob(rawJwt.value.split(".")[1])) : undefined,
	);

	async function auth() {
		await refreshTokens();
	}

	async function refreshTokens() {
		const refresh = localStorage.getItem("refresh");
		if (!refresh) return;

		const next = await client.refresh(refresh, {
			access: rawJwt.value,
		});
		if (next.err) return;
		if (!next.tokens) return rawJwt.value;

		localStorage.setItem("refresh", next.tokens.refresh);
		cookies.set("jwt", next.tokens.access, { path: "/" });

		return next.tokens.access;
	}

	async function login() {
		const { challenge, url } = await client.authorize(
			`${window.location.origin}/auth/callback`,
			"token",
			{
				pkce: true,
			},
		);
		sessionStorage.setItem("challenge", JSON.stringify(challenge));
		window.location.href = url;
	}

	async function callback(hash: string) {
		const challengeInStore = sessionStorage.getItem("challenge");
		if (!challengeInStore) {
			throw new Error("Challenge not found");
		}

		const params = new URLSearchParams(hash.slice(1));
		const access_token = params.get("access_token");
		const refresh_token = params.get("refresh_token");

		if (!access_token || !refresh_token) {
			throw new Error("Access token or refresh token not found");
		}

		localStorage.setItem("refresh", refresh_token);
		cookies.set("jwt", access_token, { path: "/" });
		window.location.replace("/");
	}

	function logout() {
		localStorage.removeItem("refresh");
		cookies.remove("jwt");

		// window.location.replace("/");
	}

	return {
		login,
		logout,

		callback,
		auth,

		rawJwt,
		jwt,
	};
});
