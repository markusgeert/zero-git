/**
 * Prefetch pages to make navigation faster (from route to route)
 * Monkey patch router-link to trigger async import when the link is in the viewport
 * Use a queue & requestIdleCallback to prevent browser from freezing
 * Install in Vue 3 with `import prefetch from './prefetch` then `app.use(prefetch)`
 * */

import { watchPausable } from "@vueuse/core";
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

type AsyncImport = () => Promise<void>;

const importMap = new Map<HTMLAnchorElement, AsyncImport>();
const ric = window.requestIdleCallback || setTimeout; // Fallback for Safari
const queue = ref<AsyncImport[]>([]);
const imported = new Set<AsyncImport>();

const observer = new IntersectionObserver((entries) => {
	for (const entry of entries) {
		if (entry.isIntersecting) {
			const link = entry.target as HTMLAnchorElement;
			const asyncImport = importMap.get(link) as AsyncImport;

			queue.value = [...queue.value, asyncImport];
		}
	}
});

// Handle next async import in the queue
const { pause, resume } = watchPausable(queue, ([asyncImport]) => {
	if (!asyncImport) {
		return;
	}

	// Wait for async import finished to run next iteration
	pause();

	// Wait for browser idle
	ric(async () => {
		// Ignore if network issue, will be automatically triggered again when necessary
		await asyncImport?.().catch(() => {});

		// Next iteration is ready
		resume();

		// Remove current async import from the queue to trigger next iteration
		queue.value = queue.value.slice(1);
	});
});

export default {
	install() {
		// @ts-expect-error - property mixins does not exist on RouterLink instance
		RouterLink.mixins = [
			{
				mounted() {
					// @ts-expect-error connection is not implemented in Navigator interface yet
					if (window.navigator?.connection?.saveData === true) {
						return;
					}

					let el = this.$el;

					if (el.nextSibling instanceof HTMLAnchorElement) {
						el = el.nextSibling;
					}

					// El can be a text node if using router-link as custom: https://router.vuejs.org/guide/advanced/extending-router-link.html
					if (!el?.tagName || el.target === "_blank") {
						return;
					}

					const componentMaps = useRouter()
						.resolve(this.$props.to)
						.matched.map(({ components }) => components)
						.filter((component) => component !== undefined);
					if (!componentMaps) {
						return;
					}

					for (const components of componentMaps) {
						if (!components) {
							continue;
						}
						for (const component of Object.values(
							components as Record<string, AsyncImport>,
						)) {
							// Component already imported becomes an object instead of a function
							// Or if already imported, prevent the function execution
							if (typeof component !== "function") {
								continue;
							}

							if (imported.has(component)) {
								continue;
							}

							imported.add(component);
							queue.value = [...queue.value, component];
							importMap.set(el, component);
							observer.observe(el);
						}
					}
				},
				unmounted() {
					const el: HTMLAnchorElement = this.$el;

					if (!el?.tagName || el.target === "_blank") {
						return;
					}

					importMap.delete(el);
					observer.unobserve(el);
				},
			},
		];
	},
};
