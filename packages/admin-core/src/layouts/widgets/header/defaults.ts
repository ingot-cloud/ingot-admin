import {
  defineHeaderBuiltinUserMenuItem,
  defineHeaderBuiltinUtility,
  InAdminHeaderBuiltinUserMenuName as UserMenuName,
  InAdminHeaderBuiltinUtilityName as UtilityName,
  type InAdminHeaderBuiltinUserMenuName,
  type InAdminHeaderBuiltinUtilityName,
  type InAdminHeaderUserMenuItem,
  type InAdminHeaderUtilityItem,
} from "@/plugin/header";

export const DEFAULT_HEADER_SEARCH_PLACEHOLDER = "搜索功能导航";

export const DEFAULT_HEADER_UTILITIES: InAdminHeaderUtilityItem[] = [
  defineHeaderBuiltinUtility(UtilityName.Fullscreen, { label: "全屏" }),
  defineHeaderBuiltinUtility(UtilityName.Settings, { label: "设置" }),
];

export const DEFAULT_HEADER_USER_MENU: InAdminHeaderUserMenuItem[] = [
  defineHeaderBuiltinUserMenuItem(UserMenuName.SwitchOrg, {
    label: "切换组织",
    icon: "icon-park:switch",
  }),
  defineHeaderBuiltinUserMenuItem(UserMenuName.FixPwd, {
    label: "修改密码",
    icon: "ep:edit",
  }),
  defineHeaderBuiltinUserMenuItem(UserMenuName.Logout, {
    label: "退出登录",
    icon: "ep:switch-button",
  }),
];

const UTILITY_LABEL: Record<InAdminHeaderBuiltinUtilityName, string> = {
  [UtilityName.Fullscreen]: "全屏",
  [UtilityName.Settings]: "设置",
};

const USER_MENU_LABEL: Record<InAdminHeaderBuiltinUserMenuName, string> = {
  [UserMenuName.SwitchOrg]: "切换组织",
  [UserMenuName.FixPwd]: "修改密码",
  [UserMenuName.Logout]: "退出登录",
};

const USER_MENU_ICON: Record<InAdminHeaderBuiltinUserMenuName, string> = {
  [UserMenuName.SwitchOrg]: "icon-park:switch",
  [UserMenuName.FixPwd]: "ep:edit",
  [UserMenuName.Logout]: "ep:switch-button",
};

export const builtinUtilityLabel = (name: InAdminHeaderBuiltinUtilityName): string =>
  UTILITY_LABEL[name];

export const builtinUserMenuLabel = (name: InAdminHeaderBuiltinUserMenuName): string =>
  USER_MENU_LABEL[name];

export const builtinUserMenuIcon = (name: InAdminHeaderBuiltinUserMenuName): string =>
  USER_MENU_ICON[name];
