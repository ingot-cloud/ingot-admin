import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import pinia from "./stores";
import directive from "./directive";
import components from "./components";
import "@/styles";
import "uno.css";
import "virtual:svg-icons-register";

const app = createApp(App);
app.use(pinia).use(router).use(directive).use(components).mount("#app");
