import { describe, expect, it } from "vitest";
import { InAdminHeaderBuiltinUtilityName } from "@/plugin/header";
import { adaptLegacyUtilities } from "./adaptLegacyUtilities";

const fullscreen = InAdminHeaderBuiltinUtilityName.Fullscreen;
const settings = InAdminHeaderBuiltinUtilityName.Settings;

describe("adaptLegacyUtilities", () => {
  it("未实现且无点击的非内置项会被过滤", () => {
    const result = adaptLegacyUtilities(
      [
        { key: "notify", label: "通知", icon: "ep:bell" },
        { key: "task", label: "待办", icon: "ep:list", onClick: () => undefined },
      ],
      false,
    );
    expect(result.map((item) => item.key)).toEqual(["task", fullscreen, settings]);
  });

  it("featureFlag 为 false 时隐藏对应内置项", () => {
    const result = adaptLegacyUtilities(
      [{ key: fullscreen, label: "全屏", featureFlag: false }],
      false,
    );
    expect(result.map((item) => item.key)).toEqual([settings]);
  });

  it("窄屏隐藏低优先级自定义项", () => {
    const result = adaptLegacyUtilities(
      [
        { key: "notify", label: "通知", priority: 10, onClick: () => undefined },
        { key: "task", label: "待办", priority: 50, onClick: () => undefined },
      ],
      true,
    );
    expect(result.map((item) => item.key)).toEqual(["task", fullscreen, settings]);
  });
});
