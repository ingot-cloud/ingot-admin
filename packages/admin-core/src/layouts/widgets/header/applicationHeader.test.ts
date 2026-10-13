import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { resolveApplicationGroups } from "./applicationHeader";
import { resolveHeaderConfig } from "./resolveHeaderConfig";

const applications = [
  { id: "a", code: "one", name: "应用一", sortOrder: 1 },
  { id: "b", code: "two", name: "应用二", icon: "ep:monitor", sortOrder: 2 },
  { id: "c", code: "three", name: "应用三", sortOrder: 3 },
];

describe("应用导航配置", () => {
  it.each([undefined, 0, -1, 1.5, NaN, Infinity])(
    "应用数量 %s 回退默认 2，配置模式保留原语义",
    (maximum) => {
      expect(
        resolveHeaderConfig({ navigation: { source: "applications", maxVisibleItems: maximum } })
          .navigation.maxVisibleItems,
      ).toBe(2);
      expect(
        resolveHeaderConfig({ navigation: { maxVisibleItems: maximum } }).navigation
          .maxVisibleItems,
      ).toBe(maximum);
    },
  );

  it.each([1, 3])("应用数量可配置为 %s", (maximum) => {
    expect(
      resolveHeaderConfig({ navigation: { source: "applications", maxVisibleItems: maximum } })
        .navigation.maxVisibleItems,
    ).toBe(maximum);
  });

  it("按分类顺序和应用原顺序匹配 code，忽略未知应用、移除空组并更新响应式标题", () => {
    const title = ref("工具");
    const groups = [
      { key: "tools", title, applicationCodes: ["three", "one", "unavailable"], columns: 2 },
      { key: "empty", title: "空组", applicationCodes: ["unauthorized"] },
    ];
    const resolved = resolveApplicationGroups(applications, groups);
    expect(resolved.map((group) => [group.title, group.items.map((item) => item.key)])).toEqual([
      ["工具", ["a", "c"]],
      ["其他应用", ["b"]],
    ]);
    expect(resolved[0]?.columns).toBe(2);
    expect(resolved[0]?.items[0]?.icon).toBe("ep:monitor");
    title.value = "办公应用";
    expect(resolveApplicationGroups(applications, groups)[0]?.title).toBe("办公应用");
  });

  it("无分类统一归入应用，无可导航应用不生成空组", () => {
    expect(resolveApplicationGroups(applications, []).map((group) => group.title)).toEqual([
      "应用",
    ]);
    expect(resolveApplicationGroups([], [])).toEqual([]);
    const groups = [{ key: "only", title: "指定", applicationCodes: ["one", "two", "three"] }];
    expect(resolveApplicationGroups(applications, groups)).toHaveLength(1);
  });

  it("重复分类 key 或重复 code 显式失败，兜底 key 不与宿主分类冲突", () => {
    expect(() =>
      resolveApplicationGroups(applications, [
        { key: "same", title: "一", applicationCodes: ["one"] },
        { key: "same", title: "二", applicationCodes: ["two"] },
      ]),
    ).toThrow("重复");
    expect(() =>
      resolveApplicationGroups(applications, [
        { key: "one", title: "一", applicationCodes: ["one"] },
        { key: "two", title: "二", applicationCodes: ["one"] },
      ]),
    ).toThrow("重复");
    const groups = resolveApplicationGroups(applications, [
      { key: "application-fallback", title: "指定", applicationCodes: ["one"] },
    ]);
    expect(new Set(groups.map((group) => group.key)).size).toBe(groups.length);
  });
});
