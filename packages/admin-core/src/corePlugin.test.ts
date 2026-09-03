import { describe, expect, it } from "vitest";
import { adminCorePlugin } from "./corePlugin";
import { PageLayoutViewPath, PLUGIN_UNAVAILABLE_PAGE_KEY } from "./router/constants";

describe("adminCorePlugin", () => {
  it("注册四种标准布局与插件不可用页", () => {
    expect(adminCorePlugin.layouts?.[PageLayoutViewPath.MAIN]).toBeTypeOf("function");
    expect(adminCorePlugin.layouts?.[PageLayoutViewPath.SIMPLE]).toBeTypeOf("function");
    expect(adminCorePlugin.layouts?.[PageLayoutViewPath.IFRAME]).toBeTypeOf("function");
    expect(adminCorePlugin.layouts?.[PageLayoutViewPath.EXTERNAL]).toBeTypeOf("function");
    expect(adminCorePlugin.pages?.[PLUGIN_UNAVAILABLE_PAGE_KEY]).toBeTypeOf("function");
  });
});
