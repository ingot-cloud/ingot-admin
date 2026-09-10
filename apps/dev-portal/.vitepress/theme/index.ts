import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import Layout from "./Layout.vue";
import AppWizard from "../../src/wizards/AppWizard.vue";
import PluginWizard from "../../src/wizards/PluginWizard.vue";
import ThemeWizard from "../../src/wizards/ThemeWizard.vue";
import DemoFrame from "../../src/components/DemoFrame.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.use(ElementPlus);
    app.component("AppWizard", AppWizard);
    app.component("PluginWizard", PluginWizard);
    app.component("ThemeWizard", ThemeWizard);
    app.component("DemoFrame", DemoFrame);
  },
} satisfies Theme;
