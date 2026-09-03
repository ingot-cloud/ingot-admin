import { describe, expect, it } from "vitest";
import {
  configurePageResolver,
  listRegisteredViews,
} from "./constants";

describe("listRegisteredViews", () => {
  it("隐藏 common. 系统页，保留布局与业务页", () => {
    configurePageResolver("ingot-admin", () => undefined, () => [
      { key: "common.plugin.unavailable", kind: "page", pluginId: "ingot-admin-core" },
      { key: "common.init", kind: "page", pluginId: "ingot-admin-core" },
      { key: "layout.main", kind: "layout", pluginId: "ingot-admin-core" },
      { key: "security.sessions", kind: "page", pluginId: "ingot-security" },
    ]);

    expect(listRegisteredViews()).toEqual([
      { key: "layout.main", kind: "layout", pluginId: "ingot-admin-core" },
      { key: "security.sessions", kind: "page", pluginId: "ingot-security" },
    ]);
  });
});
