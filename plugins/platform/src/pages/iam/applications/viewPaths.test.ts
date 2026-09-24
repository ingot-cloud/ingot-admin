import { describe, expect, it, vi } from "vitest";

vi.mock("@ingot/admin-core", () => ({
  listRegisteredViews: () => [
    { key: "layout.basic", kind: "layout", pluginId: "core" },
    { key: "platform.iam.accounts", kind: "page", pluginId: "platform" },
    { key: "org.iam.members", kind: "page", pluginId: "org" },
  ],
}));

describe("application menu view paths", () => {
  it("按布局和插件分组当前可用注册键", async () => {
    const { viewPathOptionGroups } = await import("./viewPaths");
    const groups = viewPathOptionGroups();
    expect(groups.map((item) => item.label)).toEqual(["布局", "页面 · platform", "页面 · org"]);
    expect(groups[1]?.options[0]?.value).toBe("platform.iam.accounts");
  });
});
