import type { Component, ComputedRef, Ref } from "vue";
import type { InNavigationMode } from "../components/types";

/**
 * 默认顶栏的公开配置契约。
 *
 * APP 通过 `bootstrapAdminApp({ header })` 注入；类型、常量和工厂从 `@ingot/admin-core` 导入。
 * 组件与回调只经应用注入传递，不要写入 `configureAdminRuntime` 或 Pinia 持久化。
 */

/**
 * 顶栏配置中的动态值：静态量、ref/computed 或 getter。
 * 核心在 setup 中解析为当前值；不要写入可序列化运行时或 Pinia 持久化。
 */
export type InAdminHeaderReactive<T> = T | Ref<T> | ComputedRef<T> | (() => T);

/**
 * 顶栏条目种类，配置 `type` 时使用，不要手写字符串。
 *
 * - `Builtin`：核心已实现的能力，靠 `name` 区分（全屏、设置、退出登录等）
 * - `Action`：APP 提供点击回调的入口或菜单项
 * - `Group`：大类入口，展开分组面板
 * - `Component`：APP 提供的自定义 Vue 组件
 * - `Divider`：用户菜单分割线
 */
export const InAdminHeaderItemType = {
  /** 核心已实现能力，必须搭配对应的 `name` */
  Builtin: "builtin",
  /** APP 自定义动作，点击走 `onClick` */
  Action: "action",
  /** 大类分组入口，展开 `groups` 面板 */
  Group: "group",
  /** 自定义组件，由 APP 传入 `component` */
  Component: "component",
  /** 用户菜单分割线 */
  Divider: "divider",
} as const;

/** 顶栏条目种类取值，使用同名常量而不是手写字符串。 */
export type InAdminHeaderItemType =
  (typeof InAdminHeaderItemType)[keyof typeof InAdminHeaderItemType];

/**
 * 大类分组面板的打开方式。
 * 写在 `navigation.groupTrigger` 作为默认值，单条分组入口可用 `trigger` 覆盖。
 */
export const InAdminHeaderNavGroupTrigger = {
  /** 指针悬停打开；移出后短暂延迟关闭 */
  Hover: "hover",
  /** 点击打开，再次点击或点外部关闭 */
  Click: "click",
} as const;

/** 分组面板打开方式取值，使用同名常量而不是手写字符串。 */
export type InAdminHeaderNavGroupTrigger =
  (typeof InAdminHeaderNavGroupTrigger)[keyof typeof InAdminHeaderNavGroupTrigger];

/**
 * 核心已实现的顶栏小部件名称，配置 `type: Builtin` 时使用。
 * 不会自动插入列表：只有写进 `utilities`（或走默认列表）才会出现。
 */
export const InAdminHeaderBuiltinUtilityName = {
  /** 全屏切换 */
  Fullscreen: "fullscreen",
  /** 打开布局/偏好设置 */
  Settings: "settings",
} as const;

/** 内置小部件名称取值，使用同名常量而不是手写字符串。 */
export type InAdminHeaderBuiltinUtilityName =
  (typeof InAdminHeaderBuiltinUtilityName)[keyof typeof InAdminHeaderBuiltinUtilityName];

/**
 * 核心已实现的用户菜单项名称，配置 `type: Builtin` 时使用。
 * 不会自动插入列表：只有写进 `user.menu`（或走默认列表）才会出现。
 */
export const InAdminHeaderBuiltinUserMenuName = {
  /** 切换组织，确认后进入登录选组织流程 */
  SwitchOrg: "switchOrg",
  /** 打开修改密码对话框 */
  FixPwd: "fixPwd",
  /** 退出登录并刷新 */
  Logout: "logout",
} as const;

/** 内置用户菜单名称取值，使用同名常量而不是手写字符串。 */
export type InAdminHeaderBuiltinUserMenuName =
  (typeof InAdminHeaderBuiltinUserMenuName)[keyof typeof InAdminHeaderBuiltinUserMenuName];

/** 顶栏列表项的通用展示字段。`key` 必须在同一列表内稳定且唯一。 */
export interface InAdminHeaderItemBase {
  /** 稳定唯一键，用于渲染、选中和宽度收纳，不要用随机值 */
  key: string;
  /** 展示文案；内置项省略时用核心默认文案 */
  label?: InAdminHeaderReactive<string>;
  /** Iconify 图标名；内置用户菜单项省略时用核心默认图标 */
  icon?: InAdminHeaderReactive<string | undefined>;
  /** 为 `false` 时不渲染，也不参与宽度计算 */
  visible?: InAdminHeaderReactive<boolean>;
  /** 为 `true` 时展示但不可点击、不发出选中 */
  disabled?: InAdminHeaderReactive<boolean>;
}

/**
 * 自定义品牌组件收到的 props。
 * 标题和 Logo 仍来自 `branding`，此处只描述侧栏形态。
 */
export interface InAdminHeaderBrandProps {
  /** 当前导航模式（侧栏展开、收起、覆盖层等） */
  navigationMode: InNavigationMode;
  /** 品牌区是否处于紧凑形态（无标题或窄占位） */
  compact: boolean;
}

/**
 * 品牌区配置。不传则展示默认 Logo + 标题。
 * `visible: false` 时桌面仍保留与侧栏对齐的占位。
 */
export interface InAdminHeaderBrandConfig {
  /** 是否展示品牌内容；隐藏时桌面仍保留对齐占位 */
  visible?: InAdminHeaderReactive<boolean>;
  /** 替换默认 Logo/标题的自定义组件，props 见 `InAdminHeaderBrandProps` */
  component?: Component;
}

/**
 * 分组面板内的菜单项。点击后 `onSelect` 会带上所属入口 `entryKey` 与本项 `itemKey`。
 */
export type InAdminHeaderNavMenuItem = InAdminHeaderItemBase;

/**
 * 分组面板中的一列。宽屏按组多列，组标题下有分割线。
 * 大类最多「入口 → 分组 → 菜单项」，不做更深递归。
 */
export interface InAdminHeaderNavGroup {
  /** 分组稳定唯一键，同一入口内不可重复 */
  key: string;
  /** 分组标题，展示为灰字 + 底部分割线 */
  title: InAdminHeaderReactive<string>;
  /** 该组下的菜单项，与标题左对齐 */
  items: InAdminHeaderNavMenuItem[];
}

/**
 * 大类直出入口：点击即选中，不展开面板。
 * `type` 可省略，缺省视为 Action。
 */
export interface InAdminHeaderNavActionItem extends InAdminHeaderItemBase {
  /** 直出入口；省略时与 Action 相同 */
  type?: typeof InAdminHeaderItemType.Action;
}

/**
 * 大类分组入口：展示 caret，按 `trigger` 打开分组面板。
 */
export interface InAdminHeaderNavGroupItem extends InAdminHeaderItemBase {
  type: typeof InAdminHeaderItemType.Group;
  /** 面板内部分组，至少一组 */
  groups: InAdminHeaderNavGroup[];
  /**
   * 本条入口的打开方式。省略则跟随 `navigation.groupTrigger`，再缺省为 Hover。
   */
  trigger?: InAdminHeaderNavGroupTrigger;
}

/** 大类区一条入口：直出动作或分组面板。 */
export type InAdminHeaderNavItem = InAdminHeaderNavActionItem | InAdminHeaderNavGroupItem;

/**
 * 大类选中回调参数。直出入口只有 `entryKey`；点分组内菜单项时额外带 `itemKey`。
 * 核心不写回 `activeKey`，由 APP 在回调里自行更新。
 */
export interface InAdminHeaderNavSelectPayload {
  /** 被点击的大类入口 key */
  entryKey: string;
  /** 分组面板内菜单项 key；直出入口点击时为空 */
  itemKey?: string;
}

/**
 * 大类菜单区。`items` 省略则为空（不展示大类）。
 * `activeKey` 指向不存在或已隐藏的入口时按未选中处理。
 */
export interface InAdminHeaderNavigationConfig {
  /** 大类入口列表，从左到右排列；宽度不足时按算法收纳 */
  items?: InAdminHeaderReactive<InAdminHeaderNavItem[]>;
  /** 当前选中入口，由 APP 控制；核心只读并高亮 */
  activeKey?: InAdminHeaderReactive<string | undefined>;
  /** 点击直出入口或分组菜单项时通知 APP，可在此联动侧栏或路由 */
  onSelect?: (payload: InAdminHeaderNavSelectPayload) => void;
  /**
   * 分组面板默认打开方式，单条入口的 `trigger` 可覆盖。
   * 缺省 Hover。
   */
  groupTrigger?: InAdminHeaderNavGroupTrigger;
}

/**
 * 自定义搜索组件收到的 props。
 * 紧凑时同一实例会挂到浮层，输入状态应自行保留。
 */
export interface InAdminHeaderSearchProps {
  /** 宽度不足时为 `true`，入口收成图标 */
  compact: boolean;
}

/**
 * 搜索区配置。显隐仍只由 `settings.showSearch` 与设置 store 决定，本对象管内容和占位。
 */
export interface InAdminHeaderSearchConfig {
  /** 默认搜索框占位文案 */
  placeholder?: InAdminHeaderReactive<string>;
  /** 替换默认搜索框的自定义组件，props 见 `InAdminHeaderSearchProps` */
  component?: Component;
}

/** 小部件右上角角标。数字 `0`、字符串 `"0"`、空字符串和 `undefined` 都不展示。 */
export interface InAdminHeaderUtilityBadge {
  /** 角标内容；无有效值时不渲染 */
  badge?: InAdminHeaderReactive<string | number | undefined>;
}

/**
 * 核心已实现的小部件。`name` 决定渲染全屏还是设置，建议用 `defineHeaderBuiltinUtility`。
 */
export interface InAdminHeaderBuiltinUtility
  extends InAdminHeaderItemBase, InAdminHeaderUtilityBadge {
  type: typeof InAdminHeaderItemType.Builtin;
  /** 内置能力名称，见 `InAdminHeaderBuiltinUtilityName` */
  name: InAdminHeaderBuiltinUtilityName;
}

/**
 * APP 自定义小部件：图标按钮，点击执行 `onClick`。
 */
export interface InAdminHeaderActionUtility
  extends InAdminHeaderItemBase, InAdminHeaderUtilityBadge {
  type: typeof InAdminHeaderItemType.Action;
  /** 点击回调；支持 Promise，执行期间避免重复触发 */
  onClick: () => void | Promise<void>;
}

/**
 * APP 自定义小部件：整块由传入组件渲染，收纳到「更多」时通过 props 告知。
 */
export interface InAdminHeaderComponentUtility
  extends InAdminHeaderItemBase, InAdminHeaderUtilityBadge {
  type: typeof InAdminHeaderItemType.Component;
  /** 自定义小部件组件，props 见 `InAdminHeaderUtilityComponentProps` */
  component: Component;
}

/**
 * 功能小部件列表项：内置、图标动作或自定义组件。
 * `utilities` 省略用默认（全屏、设置）；显式数组视为完整列表，空数组清空。
 */
export type InAdminHeaderUtilityItem =
  | InAdminHeaderBuiltinUtility
  | InAdminHeaderActionUtility
  | InAdminHeaderComponentUtility;

/**
 * 自定义小部件组件收到的 props。
 * 收纳进「更多」时 `overflowed` 为 true，勿再单独挂一份实例。
 */
export interface InAdminHeaderUtilityComponentProps {
  /** 是否已从顶栏直出收纳到更多浮层 */
  overflowed: boolean;
  /** 是否禁用交互 */
  disabled: boolean;
}

/**
 * 核心已实现的用户菜单项。`name` 决定切换组织、改密或退出，
 * 建议用 `defineHeaderBuiltinUserMenuItem`。
 */
export interface InAdminHeaderBuiltinUserMenuItem extends InAdminHeaderItemBase {
  type: typeof InAdminHeaderItemType.Builtin;
  /** 内置能力名称，见 `InAdminHeaderBuiltinUserMenuName` */
  name: InAdminHeaderBuiltinUserMenuName;
}

/**
 * APP 自定义用户菜单项，点击执行 `onClick`。
 */
export interface InAdminHeaderActionUserMenuItem extends InAdminHeaderItemBase {
  type: typeof InAdminHeaderItemType.Action;
  /** 点击回调；支持 Promise，失败时用项目消息能力提示 */
  onClick: () => void | Promise<void>;
}

/**
 * 用户菜单分割线。头像区下方、退出登录上方核心会固定画线，配置里相邻分割线会去重。
 */
export interface InAdminHeaderDividerUserMenuItem {
  type: typeof InAdminHeaderItemType.Divider;
  /** 分割线稳定唯一键 */
  key: string;
  /** 为 `false` 时不渲染该分割线 */
  visible?: InAdminHeaderReactive<boolean>;
}

/**
 * 用户下拉菜单项：内置动作、自定义动作或分割线。
 * `user.menu` 省略用默认（切换组织、修改密码、退出登录）；显式数组视为完整列表，空数组清空。
 */
export type InAdminHeaderUserMenuItem =
  | InAdminHeaderBuiltinUserMenuItem
  | InAdminHeaderActionUserMenuItem
  | InAdminHeaderDividerUserMenuItem;

/**
 * 传给自定义用户入口的当前用户信息，来自登录态，不是 header 配置字段。
 */
export interface InAdminHeaderUserInfo {
  /** 展示名 */
  username: string;
  /** 头像 URL，缺省回退姓名末两字 */
  avatar?: string;
}

/**
 * 自定义用户入口组件收到的 props。
 * 组件只负责展示触发器，下拉菜单仍由核心包裹。
 */
export interface InAdminHeaderUserTriggerProps {
  /** 当前登录用户 */
  user: InAdminHeaderUserInfo;
  /** 顶栏过窄时为 `true`，通常只保留头像 */
  compact: boolean;
}

/**
 * 用户区配置。不传 `component` 则用默认头像触发器。
 */
export interface InAdminHeaderUserConfig {
  /** 替换默认头像触发器的自定义组件，props 见 `InAdminHeaderUserTriggerProps` */
  component?: Component;
  /** 强制紧凑用户区；省略时由顶栏宽度算法决定 */
  compact?: InAdminHeaderReactive<boolean>;
  /**
   * 下拉菜单。省略使用默认三项；传入数组则完整替换，空数组不渲染下拉。
   */
  menu?: InAdminHeaderReactive<InAdminHeaderUserMenuItem[]>;
}

/**
 * `bootstrapAdminApp({ header })` 的顶栏五区配置。
 * APP 只声明内容与动作，布局、默认能力、浮层和宽度收纳由 admin-core 负责。
 *
 * 自定义 `theme.parts.header` 会整栏替换默认顶栏；需要读配置时用 `useAdminShell().header`，
 * 需要解析响应式值时用 `resolveHeaderConfig`。
 */
export interface InAdminHeaderConfig {
  /** 品牌区：Logo、标题或自定义组件 */
  brand?: InAdminHeaderBrandConfig;
  /** 大类菜单：直出入口与分组面板 */
  navigation?: InAdminHeaderNavigationConfig;
  /** 搜索区内容；显隐仍走设置项 `showSearch` */
  search?: InAdminHeaderSearchConfig;
  /**
   * 功能小部件，从左到右排列，右侧优先收纳。
   * 省略为全屏 + 设置；显式数组完整替换。
   */
  utilities?: InAdminHeaderReactive<InAdminHeaderUtilityItem[]>;
  /** 用户入口与下拉菜单 */
  user?: InAdminHeaderUserConfig;
}

/**
 * 声明一项核心已实现的顶栏小部件。
 *
 * @param name 内置名称，见 `InAdminHeaderBuiltinUtilityName`
 * @param extra 文案、显隐、角标等覆盖；`key` 省略时等于 `name`
 */
export const defineHeaderBuiltinUtility = (
  name: InAdminHeaderBuiltinUtilityName,
  extra?: Omit<InAdminHeaderBuiltinUtility, "type" | "name" | "key"> & { key?: string },
): InAdminHeaderBuiltinUtility => ({
  ...extra,
  type: InAdminHeaderItemType.Builtin,
  key: extra?.key ?? name,
  name,
});

/**
 * 声明一项核心已实现的用户菜单。
 *
 * @param name 内置名称，见 `InAdminHeaderBuiltinUserMenuName`
 * @param extra 文案、图标、显隐等覆盖；`key` 省略时等于 `name`
 */
export const defineHeaderBuiltinUserMenuItem = (
  name: InAdminHeaderBuiltinUserMenuName,
  extra?: Omit<InAdminHeaderBuiltinUserMenuItem, "type" | "name" | "key"> & { key?: string },
): InAdminHeaderBuiltinUserMenuItem => ({
  ...extra,
  type: InAdminHeaderItemType.Builtin,
  key: extra?.key ?? name,
  name,
});
