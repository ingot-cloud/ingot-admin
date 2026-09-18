import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import pinia from "./stores";
import "@/styles";
import "uno.css";
import "virtual:svg-icons-register";

const app = createApp(App);
app.use(pinia).use(router).mount("#app");
