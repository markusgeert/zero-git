import "./assets/main.css";

import ui from "@nuxt/ui/vue-plugin";
import { createPinia } from "pinia";
import { createApp } from "vue";
import VueVirtualScroller from "vue-virtual-scroller";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ui);
app.use(VueVirtualScroller);

app.mount("#app");
