import { describe, expect, it } from "vitest";
import { InAdminPluginError } from "./error";
import { validateAndSortPlugins } from "./sort";
import { INGOT_ADMIN_PLUGIN_API_VERSION } from "./types";
import type { InAdminPlugin } from "./types";

const plugin = (id: string, dependsOn?: string[]): InAdminPlugin => ({
  id,
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn,
});

describe("validateAndSortPlugins", () => {
  it("按依赖排序并保持无依赖插件的声明顺序", () => {
    const result = validateAndSortPlugins([
      plugin("target-feature", ["shared-feature"]),
      plugin("unrelated-feature"),
      plugin("shared-feature"),
    ]);

    expect(result.map((item) => item.id)).toEqual([
      "shared-feature",
      "target-feature",
      "unrelated-feature",
    ]);
  });

  it.each([
    {
      plugins: [plugin("duplicate"), plugin("duplicate")],
      code: "DUPLICATE_PLUGIN_ID",
    },
    {
      plugins: [plugin("target", ["missing"])],
      code: "MISSING_PLUGIN_DEPENDENCY",
    },
    {
      plugins: [plugin("first", ["second"]), plugin("second", ["first"])],
      code: "CYCLIC_PLUGIN_DEPENDENCY",
    },
  ])("以 $code 阻止无效插件清单", ({ plugins, code }) => {
    expect(() => validateAndSortPlugins(plugins)).toThrowError(
      expect.objectContaining<Partial<InAdminPluginError>>({ code }),
    );
  });

  it("拒绝不兼容的插件 API 版本", () => {
    const invalid = {
      id: "future-plugin",
      apiVersion: 2,
    } as unknown as InAdminPlugin;

    expect(() => validateAndSortPlugins([invalid])).toThrowError(
      expect.objectContaining<Partial<InAdminPluginError>>({
        code: "UNSUPPORTED_API_VERSION",
      }),
    );
  });
});
