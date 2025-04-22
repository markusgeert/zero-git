import { useAuthStore } from "@/stores/authStore";
import { Zero } from "@rocicorp/zero";
import { createMutators, schema } from "@zero-git/zero";
import { computed } from "vue";

export function useZero() {
	const authStore = useAuthStore();

	const z = computed(() => {
		const authData = authStore.jwt;

		return new Zero({
			schema,
			mutators: createMutators(authData),
			userID: authData?.sub ?? "anon",
			server: import.meta.env.VITE_ZERO_CACHE_URL,
			auth: (error?: "invalid-token") => {
				if (error === "invalid-token") {
					authStore.logout();
					return undefined;
				}
				return authStore.rawJwt;
			},
		});
	});

	return z;
}
