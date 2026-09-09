# 顶栏 APP 配置

默认顶栏分为品牌、大类菜单、搜索、功能小部件、用户入口五区。APP 在 `bootstrapAdminApp({ header })` 声明内容与动作，`admin-core` 负责布局、默认功能、分组浮层和宽度收纳。

组件与回调只经应用注入传递，不要写入 `configureAdminRuntime` 或 Pinia 持久化。

集中配置入口：

- `apps/admin/src/header.ts` 的 `createAdminHeader()`
- create-app 生成应用的 `src/header.ts`

省略列表使用默认值：小部件为全屏、设置；用户菜单为切换组织、修改密码、退出登录。显式传入数组视为完整列表，空数组清空。用户下拉会在头像区下方、退出登录上方固定画出分割线；其余分组再用 `{ type: InAdminHeaderUserMenuItemType.Divider, key }`。

条目 `type` 按区域使用不同常量，不要共用一套种类，以免把 `Component` 写到导航或用户菜单：

| 区域 | 列表项 `type` | 允许取值 | 整区替换组件 |
| --- | --- | --- | --- |
| `navigation.items` | `InAdminHeaderNavItemType` | `Action`、`Group` | 无；品牌用 `brand.component` |
| `utilities` | `InAdminHeaderUtilityItemType` | `Builtin`、`Action`、`Component` | 无 |
| `user.menu` | `InAdminHeaderUserMenuItemType` | `Builtin`、`Action`、`Divider` | 头像用 `user.component` |
| `brand` / `search` | 无 `type` | — | `brand.component` / `search.component` |

内置能力 `name`、分组触发方式同样不要手写字符串：

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
  InAdminHeaderNavItemType,
  InAdminHeaderNavGroupTrigger,
  InAdminHeaderUtilityItemType,
  InAdminHeaderUserMenuItemType,
  type InAdminHeaderConfig,
} from "@ingot/admin-core";
import { ref } from "vue";
import BizHeaderHelp from "./components/BizHeaderHelp.vue";

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
        type: InAdminHeaderNavItemType.Group,
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
    shortcuts: [
      {
        key: "dept",
        label: "部门",
        path: "/org/dept",
        icon: "ep:office-building",
        description: "组织架构",
      },
      {
        key: "member",
        label: "成员",
        path: "/org/members",
        icon: "ep:user",
        description: "组织架构",
      },
    ],
    // component: CustomSearch,
  },
  utilities: [
    defineHeaderBuiltinUtility(InAdminHeaderBuiltinUtilityName.Fullscreen),
    {
      type: InAdminHeaderUtilityItemType.Action,
      key: "notify",
      label: "通知",
      icon: "ingot:bell-outlined",
      onClick: () => undefined,
    },
    {
      type: InAdminHeaderUtilityItemType.Component,
      key: "help",
      label: "帮助",
      component: BizHeaderHelp,
    },
    defineHeaderBuiltinUtility(InAdminHeaderBuiltinUtilityName.Settings),
  ],
  user: {
    menu: [
      defineHeaderBuiltinUserMenuItem(InAdminHeaderBuiltinUserMenuName.SwitchOrg),
      {
        type: InAdminHeaderUserMenuItemType.Action,
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
      type: InAdminHeaderNavItemType.Group,
      label: "平台",
      // trigger: InAdminHeaderNavGroupTrigger.Click, // 覆盖默认，改为点击打开
      groups: [{ key: "system", title: "系统", items: [{ key: "app", label: "应用" }] }],
    },
  ],
}
```

分组内条目多时默认每列最多 8 行再向右折列（最多 4 列），也可写 `columns` 指定列数。组标题为灰字加底部分割线，横跨该组全部菜单列；菜单项为图标 + 文案、固定列宽。窄屏仍单列。

```ts
groups: [
  {
    key: "org",
    title: "组织",
    columns: 2,
    items: [
      { key: "dept", label: "部门", icon: "ep:office-building" },
      { key: "member", label: "成员", icon: "ep:user" },
    ],
  },
]
```

## 自定义组件约定

- 品牌组件接收 `navigationMode`、`compact`
- 搜索组件接收 `compact`；紧凑入口在浮层中展示同一实例，输入状态保留
- 小部件组件接收 `overflowed`、`disabled`；收纳时不重复挂载。图标使用 `in-app-bar__icon`，颜色跟随 `--in-text-color-secondary`。内置全屏为 `bi:fullscreen` / `bi:fullscreen-exit`
- 自定义用户入口接收 `user`、`compact`，由核心包裹下拉

`utilities` 里 `Action` 只适合图标按钮。需要下拉、开关或自定义交互时用 `InAdminHeaderUtilityItemType.Component`，组件自己渲染，核心只负责占位和收纳。该 `type` 不能用于 `navigation.items` 或 `user.menu`：

```vue
<template>
  <el-tooltip :disabled="overflowed || disabled" content="帮助" effect="dark" placement="bottom">
    <button
      type="button"
      class="in-icon-button in-app-bar-utilities__action gap-8px"
      :class="{ 'is-overflow': overflowed }"
      aria-label="帮助"
      :disabled="disabled"
      @click="privateOnClick"
    >
      <in-icon name="ep:question-filled" class="in-app-bar__icon" />
      <span v-if="overflowed">帮助</span>
    </button>
  </el-tooltip>
</template>
<script setup lang="ts">
import { Message, type InAdminHeaderUtilityComponentProps } from "@ingot/admin-core";

defineOptions({
  name: "BizHeaderHelp",
});

defineProps<InAdminHeaderUtilityComponentProps>();

const privateOnClick = () => {
  Message.success("打开帮助（示例）");
};
</script>
```

跑通的示例在 `apps/admin/src/components/BizHeaderHelp.vue`，由 `createAdminHeader()` 注入。

列表项必须有稳定唯一 `key`。搜索显隐仍只使用 `settings.showSearch` 与设置 store。

## 默认菜单搜索

未替换 `header.search.component` 时，默认搜索框检索与侧栏相同的 `useRouterStore().getMenus`（权限裁剪后的动态菜单 + 插件 `staticMenus`，已去掉 `hideMenu`）。不要用 `router.getRoutes()`：公共 403/404/init 等静态路由不会出现在侧栏，也不应被搜到。只按菜单名（及祖先标题）匹配叶子节点，选中后 `router.push`。

聚焦或点击输入框打开面板：空关键词显示本机搜索历史（若有）以及 `header.search.shortcuts` 常用入口；未配置常用时展示空态占位，避免面板中段空白。输入后先出现 loading，再展示「功能」匹配列表，标题中的关键词用主题色标出。结果卡片与常用同一套样式。不提供高级搜索、「应用」分区或全局快捷键。键盘为 ↑↓ 移动高亮、Enter 打开当前项。宽度不足时仍是图标入口，浮层内复用同一输入实例。

自定义 `search.component` 仍整区替换，不会自动带上这套默认面板。

## 主题兼容

自定义 `theme.parts.header` 仍完全替换默认顶栏。可通过 `useAdminShell().header` 读取配置，需要解析响应式值时使用 `resolveHeaderConfig`。

旧 `InAppBar` `utilities` prop 与 `header-start` / `nav` / `header-end` / `utilities` 插槽保留。旧插槽作为不可拆整体收纳；新数据化入口承担逐项溢出。显式组件 prop 优先于注入配置。
