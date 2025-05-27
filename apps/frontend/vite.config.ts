import { URL, fileURLToPath } from "node:url";
import ui from "@nuxt/ui/vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import vueDevTools from "vite-plugin-vue-devtools";
import svgLoader from "vite-svg-loader";

export default defineConfig({
	plugins: [
		vue(),
		vueDevTools(),
		ui({
			ui: {
				colors: {
					primary: "emerald",
					neutral: "slate",
				},
				navigationMenu: {
					variants: {
						active: {
							false: {
								link: "text-regular",
							},
						},
					},
				},
				breadcrumb: {
					variants: {
						active: {
							false: {
								link: "text-default",
							},
						},
					},
				},
			},
		}),
		tailwindcss(),
		svgLoader(),
	],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
});
