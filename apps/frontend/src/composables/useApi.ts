import type { AppType } from "@zero-git/api";
import { hc } from "hono/client";

const client = hc<AppType>(import.meta.env.VITE_API_URL);
export function useApi() {
	return {
		client,
	};
}
