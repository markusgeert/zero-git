import { useAuthStore } from "@/stores/authStore";
import { Zero } from "@rocicorp/zero";
import { createMutators, schema } from "@zero-git/zero";
import { computed, watch } from "vue";

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
					authStore.$reset();
					return undefined;
				}
				return authStore.rawJwt;
			},
		});
	});

	if (process.env.NODE_ENV === "development") {
		watch(
			z,
			(newZ) => {
				// @ts-expect-error - z is not defined on window
				window.z = newZ;
			},
			{ immediate: true },
		);
	}

	return z;
}
