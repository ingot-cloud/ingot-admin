import { describe, expect, it } from "vitest";
import { computed, ref } from "vue";
import {
  defineHeaderBuiltinUserMenuItem,
  defineHeaderBuiltinUtility,
  InAdminHeaderBuiltinUserMenuName,
  InAdminHeaderBuiltinUtilityName,
  InAdminHeaderNavItemType,
  InAdminHeaderNavGroupTrigger,
  InAdminHeaderUserMenuItemType,
} from "@/plugin/header";
import { resolveHeaderConfig } from "./resolveHeaderConfig";
import {
  DEFAULT_HEADER_SEARCH_PLACEHOLDER,
  DEFAULT_HEADER_USER_MENU,
  DEFAULT_HEADER_UTILITIES,
} from "./defaults";

describe("resolveHeaderConfig", () => {
  it("省略配置时使用默认小部件和用户菜单", () => {
    const resolved = resolveHeaderConfig();
    expect(resolved.brand.visible).toBe(true);
    expect(resolved.navigation.items).toEqual([]);
    expect(resolved.search.placeholder).toBe(DEFAULT_HEADER_SEARCH_PLACEHOLDER);
    expect(resolved.search.shortcuts).toEqual([]);
    expect(resolved.search.emptyHint).toBe("输入关键词搜索功能导航");
    expect(resolved.utilities.map((item) => item.key)).toEqual(
      DEFAULT_HEADER_UTILITIES.map((item) => item.key),
    );
    expect(resolved.user.menu.map((item) => item.key)).toEqual(
      DEFAULT_HEADER_USER_MENU.map((item) => item.key),
    );
  });

  it("空数组清空小部件和用户菜单", () => {
    const resolved = resolveHeaderConfig({
      utilities: [],
      user: { menu: [] },
    });
    expect(resolved.utilities).toEqual([]);
    expect(resolved.user.menu).toEqual([]);
  });

  it("显式列表按顺序完整替换默认值", () => {
    const resolved = resolveHeaderConfig({
      utilities: [defineHeaderBuiltinUtility(InAdminHeaderBuiltinUtilityName.Settings)],
      user: {
        menu: [
          defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.Logout),
          {
            type: InAdminHeaderUserMenuItemType.Action,
            key: "profile",
            label: "个人资料",
            onClick: () => undefined,
          },
        ],
      },
    });
    expect(resolved.utilities.map((item) => item.key)).toEqual([
      InAdminHeaderBuiltinUtilityName.Settings,
    ]);
    expect(resolved.user.menu.map((item) => item.key)).toEqual([
      InAdminHeaderBuiltinUserMenuName.Logout,
      "profile",
    ]);
  });

  it("响应式显隐与禁用态会解析到当前值", () => {
    const visible = ref(true);
    const disabled = computed(() => true);
    const items = ref([
      { key: "ops", label: "运营", visible },
      { key: "dev", label: "研发", disabled },
    ]);
    const resolved = resolveHeaderConfig({
      navigation: { items, activeKey: () => "dev" },
    });
    expect(resolved.navigation.items.map((item) => item.key)).toEqual(["ops", "dev"]);
    expect(resolved.navigation.items[1]?.disabled).toBe(true);
    visible.value = false;
    const afterHide = resolveHeaderConfig({
      navigation: { items, activeKey: () => "dev" },
    });
    expect(afterHide.navigation.items.map((item) => item.key)).toEqual(["dev"]);
    expect(afterHide.navigation.activeKey).toBe("dev");
  });

  it("分组面板缺省 hover，条目可改为 click", () => {
    const resolved = resolveHeaderConfig({
      navigation: {
        items: [
          {
            key: "platform",
            type: InAdminHeaderNavItemType.Group,
            label: "平台",
            groups: [{ key: "system", title: "系统", items: [{ key: "app", label: "应用" }] }],
          },
          {
            key: "ops",
            type: InAdminHeaderNavItemType.Group,
            label: "运营",
            trigger: InAdminHeaderNavGroupTrigger.Click,
            groups: [{ key: "biz", title: "业务", items: [{ key: "order", label: "订单" }] }],
          },
        ],
      },
    });
    expect(resolved.navigation.items[0]?.trigger).toBe(InAdminHeaderNavGroupTrigger.Hover);
    expect(resolved.navigation.items[1]?.trigger).toBe(InAdminHeaderNavGroupTrigger.Click);
  });

  it("分组菜单按数量折列，也可指定 columns", () => {
    const manyItems = Array.from({ length: 14 }, (_, index) => ({
      key: `item-${index}`,
      label: `项${index}`,
    }));
    const resolved = resolveHeaderConfig({
      navigation: {
        items: [
          {
            key: "more",
            type: InAdminHeaderNavItemType.Group,
            label: "更多",
            groups: [
              { key: "org", title: "组织", items: manyItems },
              { key: "system", title: "系统", columns: 3, items: manyItems.slice(0, 3) },
            ],
          },
        ],
      },
    });
    expect(resolved.navigation.items[0]?.groups[0]?.columns).toBe(2);
    expect(resolved.navigation.items[0]?.groups[1]?.columns).toBe(3);
  });

  it("重复 key 抛出中文错误", () => {
    expect(() =>
      resolveHeaderConfig({
        navigation: {
          items: [
            { key: "ops", label: "运营" },
            { key: "ops", label: "重复" },
          ],
        },
      }),
    ).toThrow("顶栏导航入口存在重复的 key: ops");
  });

  it("解析搜索常用并去掉隐藏项", () => {
    const resolved = resolveHeaderConfig({
      search: {
        shortcuts: [
          { key: "dept", label: "部门", path: "/org/dept", icon: "ep:office-building" },
          { key: "hidden", label: "隐藏", path: "/hidden", visible: false },
        ],
      },
    });
    expect(resolved.search.shortcuts).toEqual([
      { key: "dept", label: "部门", path: "/org/dept", icon: "ep:office-building", description: undefined },
    ]);
  });
});
