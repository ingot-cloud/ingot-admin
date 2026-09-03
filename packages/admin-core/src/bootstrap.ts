import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import InAdminRoot from "./app/InAdminRoot.vue";
import { adminAppOptionsKey } from "./config";
import { adminCorePlugin } from "./corePlugin";
import { Http } from "./net";
import { rebindKeyStore } from "./net/crypto";
import { AdminPluginRegistry, validateAndSortPlugins } from "./plugin";
import { bindAdminRouter, configureAdminRuntime } from "./runtime";
import { createAdminPinia } from "./stores";
import type {
  InAdminAppOptions,
  InAdminPluginContext,
  InAdminRuntime,
  PageKey,
} from "./plugin";

const APP_CODE_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * 启动管理台 SPA。
 *
 * `plugins` 在构建期静态导入并注册页面/组件/静态菜单；
 * 官方 App 插件（如 `orgPlugin`）与本地插件列在同一数组即完成组合。
 *
 * @param options.appCode kebab-case 应用编码
 * @param options.plugins 构建开关：未列入的插件不会进入产物
 * @param options.staticMenus App 级静态菜单，与插件 `staticMenus`、后端动态菜单合并
 */
export const bootstrapAdminApp = async (
  options: InAdminAppOptions,
): Promise<InAdminRuntime> => {
  if (!APP_CODE_PATTERN.test(options.appCode)) {
    throw new Error(`应用编码 “${options.appCode}” 必须使用小写 kebab-case`);
  }

  const resolved = configureAdminRuntime(options);
  Http.configure(resolved.net);
  rebindKeyStore();

  const plugins = validateAndSortPlugins([adminCorePlugin, ...options.plugins]);
  const registry = new AdminPluginRegistry();
  plugins.forEach((plugin) => registry.collect(plugin));
  registry.freeze();

  const pinia = createAdminPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: registry.getStaticRoutes(),
  });
  bindAdminRouter(router);
  const app = createApp(InAdminRoot);
  const readonlyOptions = Object.freeze({ ...options });

  app.provide(adminAppOptionsKey, readonlyOptions);
  app.use(pinia);
  app.use(router);
  registry.getVuePlugins().forEach((vuePlugin) => app.use(vuePlugin));
  registry.getComponents().forEach(([name, component]) => app.component(name, component));
  registry.getDirectives().forEach(([name, directive]) => app.directive(name, directive));

  const context: InAdminPluginContext = Object.freeze({
    app,
    appCode: options.appCode,
    pinia,
    router,
    resolvePage: (pageKey: PageKey) => registry.resolvePage(pageKey),
    listViews: () => registry.listViews(),
  });
  for (const plugin of plugins) {
    await plugin.install?.(context);
  }

  app.mount(options.mountTarget ?? "#app");
  return { app, pinia, router };
};
