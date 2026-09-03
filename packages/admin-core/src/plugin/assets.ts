import type { Component, Directive } from "vue";
import { InAdminPluginError } from "./error";

export type PluginComponentGlobModule = { default: Component };

export type PluginComponentGlobModules = Record<string, PluginComponentGlobModule>;

export type PluginDirectiveGlobModule = {
  default?: Directive;
};

export type PluginDirectiveGlobModules = Record<string, PluginDirectiveGlobModule>;

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;

const normalizeSlashes = (value: string): string => value.replace(/\\/g, "/");

const stripQuery = (value: string): string => value.replace(/[?#].*$/, "");

export const toFileStem = (globPath: string): string => {
  const normalized = stripQuery(normalizeSlashes(globPath));
  const base = normalized.split("/").pop() ?? "";
  return base.replace(/\.(vue|ts|js|tsx|jsx)$/i, "");
};

export const toKebabCaseName = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();

const assertComponentName = (name: string, globPath: string): void => {
  if (name.startsWith("In") || name.startsWith("El")) {
    throw new InAdminPluginError(
      "INVALID_COMPONENT_NAME",
      `组件 “${name}” 使用了保留前缀 In*/El*，请改用 Biz*：${globPath}`,
      { pluginIds: ["app-local"], resource: name },
    );
  }
  if (!PASCAL_CASE.test(name) || !name.startsWith("Biz") || name === "Biz") {
    throw new InAdminPluginError(
      "INVALID_COMPONENT_NAME",
      `App 全局组件必须是 PascalCase 且以 Biz 开头，收到 “${name}”：${globPath}`,
      { pluginIds: ["app-local"], resource: name },
    );
  }
};

/**
 * 由 eager glob 生成全局组件表。注册名取文件名，必须为 Biz*。
 */
export const definePluginComponents = (
  modules: PluginComponentGlobModules,
): Record<string, Component> => {
  const components: Record<string, Component> = {};

  for (const [globPath, module] of Object.entries(modules)) {
    const name = toFileStem(globPath);
    assertComponentName(name, globPath);
    if (!module?.default) {
      throw new InAdminPluginError(
        "INVALID_COMPONENT_NAME",
        `组件 “${name}” 缺少 default 导出：${globPath}`,
        { pluginIds: ["app-local"], resource: name },
      );
    }
    if (components[name]) {
      throw new InAdminPluginError(
        "DUPLICATE_COMPONENT_NAME",
        `组件名 “${name}” 在约定目录中重复`,
        { pluginIds: ["app-local"], resource: name },
      );
    }
    components[name] = module.default;
  }

  return components;
};

/**
 * 由 eager glob 生成指令表。注册名为文件名的 kebab-case，模块必须 default 导出。
 */
export const definePluginDirectives = (
  modules: PluginDirectiveGlobModules,
): Record<string, Directive> => {
  const directives: Record<string, Directive> = {};

  for (const [globPath, module] of Object.entries(modules)) {
    const stem = toFileStem(globPath);
    const name = toKebabCaseName(stem);
    if (!name) {
      throw new InAdminPluginError(
        "INVALID_DIRECTIVE_MODULE",
        `无法从路径推导指令名：${globPath}`,
        { pluginIds: ["app-local"], resource: globPath },
      );
    }
    if (!module?.default) {
      throw new InAdminPluginError(
        "INVALID_DIRECTIVE_MODULE",
        `指令 “${name}” 必须 default 导出：${globPath}`,
        { pluginIds: ["app-local"], resource: name },
      );
    }
    if (directives[name]) {
      throw new InAdminPluginError(
        "DUPLICATE_DIRECTIVE_NAME",
        `指令名 “${name}” 在约定目录中重复`,
        { pluginIds: ["app-local"], resource: name },
      );
    }
    directives[name] = module.default;
  }

  return directives;
};
