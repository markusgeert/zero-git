declare module "#build/app.config" {
	import type { AppConfig } from "@nuxt/schema";

	const appConfig: AppConfig;
	export { appConfig as default };
}

declare module "#imports" {
	export * from "@nuxt/ui/runtime/vue/stubs.js";
}

declare module "#build/ui-image-component" {
	import type { Component } from "vue";

	const component: Component;
	export default component;
}

declare module "/home/runner/work/ui/ui/src/theme/checkbox-group" {}
