import "./assets/main.css";

import ui from "@nuxt/ui/vue-plugin";
import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";

import posthog from "posthog-js";

posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
	api_host: import.meta.env.VITE_POSTHOG_HOST,
	person_profiles: "always",
});

// This handles the case when the site is redeployed, and the bundle can't be found anymore
window.addEventListener("vite:preloadError", () => {
	window.location.reload();
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ui);

app.mount("#app");
