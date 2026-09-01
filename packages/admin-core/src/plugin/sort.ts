import { InAdminPluginError } from "./error";
import { INGOT_ADMIN_PLUGIN_API_VERSION } from "./types";
import type { InAdminPlugin } from "./types";

const PLUGIN_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const validateAndSortPlugins = (plugins: InAdminPlugin[]): InAdminPlugin[] => {
  const pluginsById = new Map<string, InAdminPlugin>();

  plugins.forEach((plugin) => {
    const duplicated = pluginsById.get(plugin.id);
    if (duplicated) {
      throw new InAdminPluginError(
        "DUPLICATE_PLUGIN_ID",
        `插件 ID “${plugin.id}” 重复：${duplicated.id}、${plugin.id}`,
        {
          pluginIds: [duplicated.id, plugin.id],
          resource: plugin.id,
        },
      );
    }
    if (!PLUGIN_ID_PATTERN.test(plugin.id)) {
      throw new Error(`插件 ID “${plugin.id}” 必须使用小写 kebab-case`);
    }
    if (plugin.apiVersion !== INGOT_ADMIN_PLUGIN_API_VERSION) {
      throw new InAdminPluginError(
        "UNSUPPORTED_API_VERSION",
        `插件 “${plugin.id}” 使用不兼容的 API 版本 ${plugin.apiVersion}`,
        {
          pluginIds: [plugin.id],
          resource: String(plugin.apiVersion),
        },
      );
    }
    pluginsById.set(plugin.id, plugin);
  });

  plugins.forEach((plugin) => {
    plugin.dependsOn?.forEach((dependencyId) => {
      if (!pluginsById.has(dependencyId)) {
        throw new InAdminPluginError(
          "MISSING_PLUGIN_DEPENDENCY",
          `插件 “${plugin.id}” 缺少依赖 “${dependencyId}”`,
          {
            pluginIds: [plugin.id, dependencyId],
            resource: dependencyId,
          },
        );
      }
    });
  });

  const sorted: InAdminPlugin[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (plugin: InAdminPlugin, path: string[]): void => {
    if (visited.has(plugin.id)) {
      return;
    }
    if (visiting.has(plugin.id)) {
      const cycleStart = path.indexOf(plugin.id);
      const cycle = [...path.slice(cycleStart), plugin.id];
      throw new InAdminPluginError(
        "CYCLIC_PLUGIN_DEPENDENCY",
        `插件依赖存在循环：${cycle.join(" → ")}`,
        {
          pluginIds: cycle,
          resource: cycle.join(" -> "),
        },
      );
    }

    visiting.add(plugin.id);
    plugin.dependsOn?.forEach((dependencyId) => {
      const dependency = pluginsById.get(dependencyId);
      if (dependency) {
        visit(dependency, [...path, plugin.id]);
      }
    });
    visiting.delete(plugin.id);
    visited.add(plugin.id);
    sorted.push(plugin);
  };

  plugins.forEach((plugin) => visit(plugin, []));
  return sorted;
};
