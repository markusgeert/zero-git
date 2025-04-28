import { useZero } from "@/composables/useZero";
import { defineStore } from "pinia";
import { computed } from "vue";
import { useQuery } from "zero-vue";

export type Repo = ReturnType<typeof useRepoStore>["repos"][0];

export const useRepoStore = defineStore("repo", () => {
	const z = useZero();
	const { data: repos } = useQuery(
		() => z.value.query.reposTable.related("org"),
		{
			ttl: "forever",
		},
	);

	const repoLinks = computed(() => {
		const links: Record<string, string> = {};
		for (const repo of repos.value) {
			if (!repo.org?.name) {
				continue;
			}

			links[repo.id] = `/${repo.org.name}/${repo.name}`;
		}
		return links;
	});

	return { repos, repoLinks };
});
