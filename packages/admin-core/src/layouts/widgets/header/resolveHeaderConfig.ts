import type { Component } from "vue";
import {
  InAdminHeaderNavItemType,
  InAdminHeaderUtilityItemType,
  InAdminHeaderUserMenuItemType,
  InAdminHeaderNavGroupTrigger,
  type InAdminHeaderBuiltinUserMenuName,
  type InAdminHeaderBuiltinUtilityName,
  type InAdminHeaderConfig,
  type InAdminHeaderNavGroup,
  type InAdminHeaderNavItem,
  type InAdminHeaderNavSelectPayload,
  type InAdminHeaderSearchShortcut,
  type InAdminHeaderUserMenuItem,
  type InAdminHeaderUtilityItem,
} from "@/plugin/header";
import { assertUniqueKeys } from "./assertUniqueKeys";
import {
  builtinUserMenuIcon,
  builtinUserMenuLabel,
  builtinUtilityLabel,
  DEFAULT_HEADER_SEARCH_PLACEHOLDER,
  DEFAULT_HEADER_USER_MENU,
  DEFAULT_HEADER_UTILITIES,
} from "./defaults";
import { DEFAULT_HEADER_SEARCH_EMPTY_HINT } from "../search/constants";
import { readHeaderValue } from "./readHeaderValue";

/** `resolveHeaderConfig` 解析后的搜索常用入口。 */
export interface ResolvedHeaderSearchShortcut {
  /** 稳定唯一键 */
  key: string;
  /** 主标题 */
  label: string;
  /** 跳转路径 */
  path: string;
  /** Iconify 图标名 */
  icon?: string;
  /** 次级说明 */
  description?: string;
}

/** `resolveHeaderConfig` 解析后的分组内菜单项，字段已是当前静态值。 */
export interface ResolvedHeaderNavMenuItem {
  /** 菜单项稳定唯一键 */
  key: string;
  /** 展示文案 */
  label: string;
  /** Iconify 图标名 */
  icon?: string;
  /** 是否禁用 */
  disabled: boolean;
}

/** `resolveHeaderConfig` 解析后的分组面板一列。 */
export interface ResolvedHeaderNavGroup {
  /** 分组稳定唯一键 */
  key: string;
  /** 分组标题 */
  title: string;
  /** 该组菜单项，已去掉 `visible: false` */
  items: ResolvedHeaderNavMenuItem[];
}

/** `resolveHeaderConfig` 解析后的大类入口。 */
export interface ResolvedHeaderNavItem {
  /** 入口稳定唯一键 */
  key: string;
  /** Action 为直出点击，Group 为分组面板 */
  type: typeof InAdminHeaderNavItemType.Action | typeof InAdminHeaderNavItemType.Group;
  /** 展示文案 */
  label: string;
  /** Iconify 图标名 */
  icon?: string;
  /** 是否禁用 */
  disabled: boolean;
  /** 分组面板打开方式；直出入口固定为 Click */
  trigger: InAdminHeaderNavGroupTrigger;
  /** 分组内容；直出入口为空数组 */
  groups: ResolvedHeaderNavGroup[];
}

/** `resolveHeaderConfig` 解析后的功能小部件。 */
export interface ResolvedHeaderUtilityItem {
  /** 小部件稳定唯一键 */
  key: string;
  /** Builtin / Action / Component */
  type:
    | typeof InAdminHeaderUtilityItemType.Builtin
    | typeof InAdminHeaderUtilityItemType.Action
    | typeof InAdminHeaderUtilityItemType.Component;
  /** 内置小部件名称；仅 Builtin 有值 */
  name?: InAdminHeaderBuiltinUtilityName;
  /** 展示文案 */
  label: string;
  /** Iconify 图标名 */
  icon?: string;
  /** 是否禁用 */
  disabled: boolean;
  /** 已解析的角标；无效值已被去掉 */
  badge?: string | number;
  /** 自定义动作点击回调 */
  onClick?: () => void | Promise<void>;
  /** 自定义小部件组件 */
  component?: Component;
}

/** `resolveHeaderConfig` 解析后的用户菜单项。 */
export interface ResolvedHeaderUserMenuItem {
  /** 菜单项稳定唯一键 */
  key: string;
  /** Builtin / Action / Divider */
  type:
    | typeof InAdminHeaderUserMenuItemType.Builtin
    | typeof InAdminHeaderUserMenuItemType.Action
    | typeof InAdminHeaderUserMenuItemType.Divider;
  /** 内置菜单名称；仅 Builtin 有值 */
  name?: InAdminHeaderBuiltinUserMenuName;
  /** 展示文案；分割线为空字符串 */
  label: string;
  /** Iconify 图标名 */
  icon?: string;
  /** 是否禁用 */
  disabled: boolean;
  /** 自定义动作点击回调 */
  onClick?: () => void | Promise<void>;
}

/**
 * `resolveHeaderConfig` 的返回值：响应式字段已求值，隐藏项已剔除。
 * 自定义 `theme.parts.header` 若要自己排版，应消费本结构而不是原始 `InAdminHeaderConfig`。
 */
export interface ResolvedHeaderConfig {
  /** 品牌区解析结果 */
  brand: {
    /** 是否展示品牌内容 */
    visible: boolean;
    /** 自定义品牌组件 */
    component?: Component;
  };
  /** 大类菜单解析结果 */
  navigation: {
    /** 可见入口 */
    items: ResolvedHeaderNavItem[];
    /** 当前选中入口；无效 key 仍原样返回，渲染时按未选中处理 */
    activeKey?: string;
    /** APP 选中回调 */
    onSelect?: (payload: InAdminHeaderNavSelectPayload) => void;
  };
  /** 搜索区解析结果 */
  search: {
    /** 占位文案 */
    placeholder: string;
    /** 自定义搜索组件 */
    component?: Component;
    /** 空关键词时的常用入口 */
    shortcuts: ResolvedHeaderSearchShortcut[];
    /** 无常用时的空态文案 */
    emptyHint: string;
  };
  /** 可见小部件，顺序与配置一致 */
  utilities: ResolvedHeaderUtilityItem[];
  /** 用户区解析结果 */
  user: {
    /** 自定义用户触发器 */
    component?: Component;
    /** 是否紧凑（仅头像） */
    compact: boolean;
    /** 可见菜单项，尚未插入退出登录前的固定分割线 */
    menu: ResolvedHeaderUserMenuItem[];
  };
}

const isVisible = (value: boolean | undefined): boolean => value !== false;

const resolveNavMenuItem = (
  item: InAdminHeaderNavGroup["items"][number],
): ResolvedHeaderNavMenuItem | undefined => {
  if (!isVisible(readHeaderValue(item.visible, true))) {
    return undefined;
  }
  return {
    key: item.key,
    label: readHeaderValue(item.label, ""),
    icon: readHeaderValue(item.icon, undefined),
    disabled: readHeaderValue(item.disabled, false),
  };
};

const resolveNavGroup = (group: InAdminHeaderNavGroup): ResolvedHeaderNavGroup => {
  assertUniqueKeys(
    group.items.map((item) => item.key),
    `顶栏导航分组 ${group.key} `,
  );
  return {
    key: group.key,
    title: readHeaderValue(group.title, ""),
    items: group.items
      .map(resolveNavMenuItem)
      .filter((item): item is ResolvedHeaderNavMenuItem => Boolean(item)),
  };
};

const resolveNavItem = (
  item: InAdminHeaderNavItem,
  groupTrigger: InAdminHeaderNavGroupTrigger,
): ResolvedHeaderNavItem | undefined => {
  if (!isVisible(readHeaderValue(item.visible, true))) {
    return undefined;
  }
  const isGroup = item.type === InAdminHeaderNavItemType.Group;
  const groups = isGroup ? item.groups.map(resolveNavGroup) : [];
  if (isGroup) {
    assertUniqueKeys(
      item.groups.map((group) => group.key),
      `顶栏导航入口 ${item.key} 的分组`,
    );
  }
  return {
    key: item.key,
    type: isGroup ? InAdminHeaderNavItemType.Group : InAdminHeaderNavItemType.Action,
    label: readHeaderValue(item.label, ""),
    icon: readHeaderValue(item.icon, undefined),
    disabled: readHeaderValue(item.disabled, false),
    trigger: isGroup ? (item.trigger ?? groupTrigger) : InAdminHeaderNavGroupTrigger.Click,
    groups,
  };
};

const resolveUtility = (
  item: InAdminHeaderUtilityItem,
): ResolvedHeaderUtilityItem | undefined => {
  if (!isVisible(readHeaderValue(item.visible, true))) {
    return undefined;
  }
  const label =
    item.type === InAdminHeaderUtilityItemType.Builtin
      ? readHeaderValue(item.label, builtinUtilityLabel(item.name))
      : readHeaderValue(item.label, "");
  const badge = readHeaderValue(item.badge, undefined);
  if (item.type === InAdminHeaderUtilityItemType.Builtin) {
    return {
      key: item.key,
      type: InAdminHeaderUtilityItemType.Builtin,
      name: item.name,
      label,
      icon: readHeaderValue(item.icon, undefined),
      disabled: readHeaderValue(item.disabled, false),
      badge,
    };
  }
  if (item.type === InAdminHeaderUtilityItemType.Component) {
    return {
      key: item.key,
      type: InAdminHeaderUtilityItemType.Component,
      label,
      icon: readHeaderValue(item.icon, undefined),
      disabled: readHeaderValue(item.disabled, false),
      badge,
      component: item.component,
    };
  }
  return {
    key: item.key,
    type: InAdminHeaderUtilityItemType.Action,
    label,
    icon: readHeaderValue(item.icon, undefined),
    disabled: readHeaderValue(item.disabled, false),
    badge,
    onClick: item.onClick,
  };
};

const resolveSearchShortcut = (
  item: InAdminHeaderSearchShortcut,
): ResolvedHeaderSearchShortcut | undefined => {
  if (!isVisible(readHeaderValue(item.visible, true))) {
    return undefined;
  }
  const label = readHeaderValue(item.label, "").trim();
  const path = readHeaderValue(item.path, "").trim();
  if (!label || !path) {
    return undefined;
  }
  return {
    key: item.key,
    label,
    path,
    icon: readHeaderValue(item.icon, undefined),
    description: readHeaderValue(item.description, undefined),
  };
};

const resolveUserMenuItem = (
  item: InAdminHeaderUserMenuItem,
): ResolvedHeaderUserMenuItem | undefined => {
  if (!isVisible(readHeaderValue(item.visible, true))) {
    return undefined;
  }
  if (item.type === InAdminHeaderUserMenuItemType.Divider) {
    return {
      key: item.key,
      type: InAdminHeaderUserMenuItemType.Divider,
      label: "",
      disabled: false,
    };
  }
  if (item.type === InAdminHeaderUserMenuItemType.Builtin) {
    return {
      key: item.key,
      type: InAdminHeaderUserMenuItemType.Builtin,
      name: item.name,
      label: readHeaderValue(item.label, builtinUserMenuLabel(item.name)),
      icon: readHeaderValue(item.icon, builtinUserMenuIcon(item.name)),
      disabled: readHeaderValue(item.disabled, false),
    };
  }
  return {
    key: item.key,
    type: InAdminHeaderUserMenuItemType.Action,
    label: readHeaderValue(item.label, ""),
    icon: readHeaderValue(item.icon, undefined),
    disabled: readHeaderValue(item.disabled, false),
    onClick: item.onClick,
  };
};

/**
 * 把 APP 注入的 `InAdminHeaderConfig` 解析成当前静态结构。
 * 会展开 ref/computed/getter、套上默认小部件和用户菜单、去掉隐藏项，并校验 key 唯一。
 *
 * @param config `bootstrapAdminApp({ header })` 或 `useAdminShell().header` 的原始配置
 */
export const resolveHeaderConfig = (config?: InAdminHeaderConfig): ResolvedHeaderConfig => {
  const groupTrigger = readHeaderValue(
    config?.navigation?.groupTrigger,
    InAdminHeaderNavGroupTrigger.Hover,
  );
  const navItems = readHeaderValue(config?.navigation?.items, []);
  assertUniqueKeys(
    navItems.map((item) => item.key),
    "顶栏导航入口",
  );
  const utilitiesSource =
    config?.utilities === undefined
      ? DEFAULT_HEADER_UTILITIES
      : readHeaderValue(config.utilities, DEFAULT_HEADER_UTILITIES);
  assertUniqueKeys(
    utilitiesSource.map((item) => item.key),
    "顶栏功能小部件",
  );
  const userMenuSource =
    config?.user?.menu === undefined
      ? DEFAULT_HEADER_USER_MENU
      : readHeaderValue(config.user.menu, DEFAULT_HEADER_USER_MENU);
  assertUniqueKeys(
    userMenuSource.map((item) => item.key),
    "顶栏用户菜单",
  );
  const shortcutSource = readHeaderValue(config?.search?.shortcuts, []);
  assertUniqueKeys(
    shortcutSource.map((item) => item.key),
    "顶栏搜索常用",
  );

  return {
    brand: {
      visible: readHeaderValue(config?.brand?.visible, true),
      component: config?.brand?.component,
    },
    navigation: {
      items: navItems
        .map((item) => resolveNavItem(item, groupTrigger))
        .filter((item): item is ResolvedHeaderNavItem => Boolean(item)),
      activeKey: readHeaderValue(config?.navigation?.activeKey, undefined),
      onSelect: config?.navigation?.onSelect,
    },
    search: {
      placeholder: readHeaderValue(
        config?.search?.placeholder,
        DEFAULT_HEADER_SEARCH_PLACEHOLDER,
      ),
      component: config?.search?.component,
      shortcuts: shortcutSource
        .map(resolveSearchShortcut)
        .filter((item): item is ResolvedHeaderSearchShortcut => Boolean(item)),
      emptyHint: readHeaderValue(config?.search?.emptyHint, DEFAULT_HEADER_SEARCH_EMPTY_HINT),
    },
    utilities: utilitiesSource
      .map(resolveUtility)
      .filter((item): item is ResolvedHeaderUtilityItem => Boolean(item)),
    user: {
      component: config?.user?.component,
      compact: readHeaderValue(config?.user?.compact, false),
      menu: userMenuSource
        .map(resolveUserMenuItem)
        .filter((item): item is ResolvedHeaderUserMenuItem => Boolean(item)),
    },
  };
};
