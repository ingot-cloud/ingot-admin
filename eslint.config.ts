import pluginVue from "eslint-plugin-vue";
import { baseConfig } from "./eslint.config.base.ts";

const themeVueConfigs = pluginVue.configs["flat/essential"].map((config) => ({
  ...config,
  files: ["themes/**/*.vue"],
}));

export default [...baseConfig, ...themeVueConfigs];
