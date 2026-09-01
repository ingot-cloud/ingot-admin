import type { Component, Directive, Plugin as VuePlugin } from "vue";
import type { RouteRecordName, RouteRecordRaw } from "vue-router";
import { InAdminPluginError } from "./error";
import type { AsyncComponentLoader, InAdminPlugin, PageKey } from "./types";

interface InOwnedResource<T> {
  ownerPluginId: string;
  value: T;
}

export class AdminPluginRegistry {
  private readonly pages = new Map<PageKey, InOwnedResource<AsyncComponentLoader>>();
  private readonly components = new Map<string, InOwnedResource<Component>>();
  private readonly directives = new Map<string, InOwnedResource<Directive>>();
  private readonly routeNames = new Map<RouteRecordName, string>();
  private readonly staticRoutes: RouteRecordRaw[] = [];
  private readonly vuePlugins: Array<InOwnedResource<VuePlugin>> = [];
  private frozen = false;

  public collect(plugin: InAdminPlugin): void {
    this.assertMutable();
    Object.entries(plugin.pages ?? {}).forEach(([key, loader]) => {
      this.registerUnique(
        this.pages,
        key,
        loader,
        plugin.id,
        "DUPLICATE_PAGE_KEY",
        "页面键",
      );
    });
    Object.entries(plugin.components ?? {}).forEach(([name, component]) => {
      this.registerUnique(
        this.components,
        name,
        component,
        plugin.id,
        "DUPLICATE_COMPONENT_NAME",
        "组件名",
      );
    });
    Object.entries(plugin.directives ?? {}).forEach(([name, directive]) => {
      this.registerUnique(
        this.directives,
        name,
        directive,
        plugin.id,
        "DUPLICATE_DIRECTIVE_NAME",
        "指令名",
      );
    });
    plugin.staticRoutes?.forEach((route) => {
      this.collectRoute(route, plugin.id);
      this.staticRoutes.push(route);
    });
    plugin.vuePlugins?.forEach((vuePlugin) => {
      this.vuePlugins.push({ ownerPluginId: plugin.id, value: vuePlugin });
    });
  }

  public freeze(): void {
    this.frozen = true;
  }

  public resolvePage(pageKey: PageKey): AsyncComponentLoader | undefined {
    return this.pages.get(pageKey)?.value;
  }

  public getComponents(): ReadonlyArray<readonly [string, Component]> {
    return Array.from(this.components, ([name, resource]) => [name, resource.value] as const);
  }

  public getDirectives(): ReadonlyArray<readonly [string, Directive]> {
    return Array.from(this.directives, ([name, resource]) => [name, resource.value] as const);
  }

  public getVuePlugins(): ReadonlyArray<VuePlugin> {
    return this.vuePlugins.map((resource) => resource.value);
  }

  public getStaticRoutes(): RouteRecordRaw[] {
    return [...this.staticRoutes];
  }

  private collectRoute(route: RouteRecordRaw, pluginId: string): void {
    if (route.name !== undefined) {
      const ownerPluginId = this.routeNames.get(route.name);
      if (ownerPluginId) {
        throw new InAdminPluginError(
          "DUPLICATE_ROUTE_NAME",
          `路由名 “${String(route.name)}” 在插件 “${ownerPluginId}” 与 “${pluginId}” 中重复`,
          {
            pluginIds: [ownerPluginId, pluginId],
            resource: String(route.name),
          },
        );
      }
      this.routeNames.set(route.name, pluginId);
    }
    route.children?.forEach((child) => this.collectRoute(child, pluginId));
  }

  private registerUnique<T>(
    target: Map<string, InOwnedResource<T>>,
    key: string,
    value: T,
    pluginId: string,
    code:
      | "DUPLICATE_PAGE_KEY"
      | "DUPLICATE_COMPONENT_NAME"
      | "DUPLICATE_DIRECTIVE_NAME",
    resourceLabel: string,
  ): void {
    const existing = target.get(key);
    if (existing) {
      throw new InAdminPluginError(
        code,
        `${resourceLabel} “${key}” 在插件 “${existing.ownerPluginId}” 与 “${pluginId}” 中重复`,
        {
          pluginIds: [existing.ownerPluginId, pluginId],
          resource: key,
        },
      );
    }
    target.set(key, { ownerPluginId: pluginId, value });
  }

  private assertMutable(): void {
    if (this.frozen) {
      throw new Error("插件注册表已冻结，不能在应用挂载后继续注册资源");
    }
  }
}
