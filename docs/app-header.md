# 顶栏 APP 配置

默认顶栏分为品牌、大类菜单、搜索、功能小部件、用户入口五区。APP 在 `bootstrapAdminApp({ header })` 声明内容与动作，`admin-core` 负责布局、默认功能、分组浮层和宽度收纳。

组件与回调只经应用注入传递，不要写入 `configureAdminRuntime` 或 Pinia 持久化。

集中配置入口：

- `apps/admin/src/header.ts` 的 `createAdminHeader()`
- create-app 生成应用的 `src/header.ts`

省略列表使用默认值：小部件为全屏、设置；用户菜单为切换组织、修改密码、退出登录。显式传入数组视为完整列表，空数组清空。用户下拉会在头像区下方、退出登录上方固定画出分割线；其余分组再用 `{ type: InAdminHeaderItemType.Divider, key }`。

条目 `type`、内置能力 `name`、分组触发方式不要手写字符串，使用 `@ingot/admin-core` 导出的常量与工厂：

- `InAdminHeaderItemType`：`Builtin` / `Action` / `Group` / `Component` / `Divider`
- `InAdminHeaderNavGroupTrigger`：`Hover` / `Click`
- `InAdminHeaderBuiltinUtilityName`：`Fullscreen` / `Settings`
- `InAdminHeaderBuiltinUserMenuName`：`SwitchOrg` / `FixPwd` / `Logout`
- `defineHeaderBuiltinUtility(name)`、`defineHeaderBuiltinUserMenuItem(name)`：补齐 `type` 与默认 `key`

## 基本接入

```ts
import {
  defineHeaderBuiltinUserMenuItem,
  defineHeaderBuiltinUtility,
  InAdminHeaderBuiltinUserMenuName,
  InAdminHeaderBuiltinUtilityName,
  InAdminHeaderItemType,
  InAdminHeaderNavGroupTrigger,
  type InAdminHeaderConfig,
} from "@ingot/admin-core";
import { ref } from "vue";

const activeNavKey = ref("ops");

export const createAdminHeader = (): InAdminHeaderConfig => ({
  navigation: {
    activeKey: activeNavKey,
    onSelect: ({ entryKey, itemKey }) => {
      if (itemKey) {
        return;
      }
      activeNavKey.value = entryKey;
      // 后续可在此联动侧栏菜单过滤或路由
    },
    items: [
      { key: "ops", label: "运营" },
      {
        key: "platform",
        type: InAdminHeaderItemType.Group,
        label: "平台",
        groups: [
          {
            key: "org",
            title: "组织",
            items: [
              { key: "dept", label: "部门" },
              { key: "member", label: "成员" },
            ],
          },
        ],
      },
    ],
  },
  search: {
    placeholder: "搜索功能导航",
    // component: CustomSearch,
  },
  utilities: [
    defineHeaderBuiltinUtility(InAdminHeaderBuiltinUtilityName.Fullscreen),
    {
      type: InAdminHeaderItemType.Action,
      key: "notify",
      label: "通知",
      icon: "ep:bell",
      onClick: () => undefined,
    },
    defineHeaderBuiltinUtility(InAdminHeaderBuiltinUtilityName.Settings),
  ],
  user: {
    menu: [
      defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.SwitchOrg),
      {
        type: InAdminHeaderItemType.Action,
        key: "profile",
        label: "个人资料",
        icon: "ep:user",
        onClick: () => undefined,
      },
      defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.FixPwd),
      defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.Logout),
    ],
  },
});
```

动态 `visible` / `disabled` / `badge` / `activeKey` 可使用 ref、computed 或 getter。隐藏项不展示；禁用项不可触发。不存在或已隐藏的选中 key 按未选中处理，核心不会写回 APP。

分组菜单默认 **hover** 展开面板，也可改为点击：

```ts
navigation: {
  groupTrigger: InAdminHeaderNavGroupTrigger.Hover, // 默认；可改为 Click
  items: [
    {
      key: "platform",
      type: InAdminHeaderItemType.Group,
      label: "平台",
      // trigger: InAdminHeaderNavGroupTrigger.Click, // 覆盖默认，改为点击打开
      groups: [{ key: "system", title: "系统", items: [{ key: "app", label: "应用" }] }],
    },
  ],
}
```

## 自定义组件约定

- 品牌组件接收 `navigationMode`、`compact`
- 搜索组件接收 `compact`；紧凑入口在浮层中展示同一实例，输入状态保留
- 小部件组件接收 `overflowed`、`disabled`；收纳时不重复挂载
- 自定义用户入口接收 `user`、`compact`，由核心包裹下拉

列表项必须有稳定唯一 `key`。搜索显隐仍只使用 `settings.showSearch` 与设置 store。

## 主题兼容

自定义 `theme.parts.header` 仍完全替换默认顶栏。可通过 `useAdminShell().header` 读取配置，需要解析响应式值时使用 `resolveHeaderConfig`。

旧 `InAppBar` `utilities` prop 与 `header-start` / `nav` / `header-end` / `utilities` 插槽保留。旧插槽作为不可拆整体收纳；新数据化入口承担逐项溢出。显式组件 prop 优先于注入配置。
