import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "./tokens.css";
import DemoApp from "./DemoApp.vue";

const app = createApp(DemoApp);
app.use(ElementPlus);
app.mount("#app");

window.addEventListener("message", (event: MessageEvent) => {
  if (event.origin !== window.location.origin) {
    return;
  }
  if (event.data?.type === "ingot-demo-theme") {
    document.documentElement.classList.toggle("dark", Boolean(event.data.dark));
    document.documentElement.style.colorScheme = event.data.dark ? "dark" : "light";
  }
});
