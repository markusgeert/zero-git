import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: HomeView,
		},
		{
			path: "/auth/callback",
			name: "callback",
			component: () => import("../views/AuthCallbackView.vue"),
		},
		{
			path: "/repo/:repoId",
			name: "showRepo",
			component: () => import("../views/AuthCallbackView.vue"),
		},
		{
			path: "/:org",
			name: "org",
			component: () => import("../views/AuthCallbackView.vue"),
		},
		{
			path: "/:org/:repo",
			name: "repo",
			component: () => import("../views/RepoView.vue"),
			redirect: { name: "code" },
			children: [
				{
					path: "",
					name: "code",
					component: () => import("../views/CodeView.vue"),
				},
				{
					path: "issues",
					name: "issues",
					component: () => import("../views/IssuesView.vue"),
				},
				{
					path: "pulls",
					name: "pull-requests",
					component: () => import("../views/PRsView.vue"),
				},
				{
					path: "pull/:prId",
					name: "pull-request",
					component: () => import("../views/PRView.vue"),
				},
			],
		},
		{
			path: "/not-found",
			name: "not-found",
			component: HomeView,
		},
	],
});

router.onError((error, to) => {
	if (
		error.message.includes("Failed to fetch dynamically imported module") ||
		error.message.includes("Importing a module script failed")
	) {
		// @ts-expect-error - for some reason we can't assign the new path to the window.location
		window.location = to.fullPath;
	}
});

export default router;
