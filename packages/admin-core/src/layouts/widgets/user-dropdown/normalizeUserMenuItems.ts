import {
  InAdminHeaderBuiltinUserMenuName,
  InAdminHeaderUserMenuItemType,
} from "@/plugin/header";
import type { ResolvedHeaderUserMenuItem } from "../header/resolveHeaderConfig";

export const USER_MENU_LOGOUT_DIVIDER_KEY = "in-user-logout-divider";

const isLogout = (item: ResolvedHeaderUserMenuItem): boolean =>
  item.type === InAdminHeaderUserMenuItemType.Builtin &&
  item.name === InAdminHeaderBuiltinUserMenuName.Logout;

const collapseDividers = (
  items: ResolvedHeaderUserMenuItem[],
): ResolvedHeaderUserMenuItem[] => {
  const result: ResolvedHeaderUserMenuItem[] = [];
  for (const item of items) {
    if (
      item.type === InAdminHeaderUserMenuItemType.Divider &&
      result[result.length - 1]?.type === InAdminHeaderUserMenuItemType.Divider
    ) {
      continue;
    }
    result.push(item);
  }
  while (result[0]?.type === InAdminHeaderUserMenuItemType.Divider) {
    result.shift();
  }
  while (result[result.length - 1]?.type === InAdminHeaderUserMenuItemType.Divider) {
    result.pop();
  }
  return result;
};

export const normalizeUserMenuItems = (
  items: ResolvedHeaderUserMenuItem[],
): ResolvedHeaderUserMenuItem[] => {
  const result: ResolvedHeaderUserMenuItem[] = [];
  for (const item of collapseDividers(items)) {
    if (
      isLogout(item) &&
      result.length > 0 &&
      result[result.length - 1]?.type !== InAdminHeaderUserMenuItemType.Divider
    ) {
      result.push({
        key: USER_MENU_LOGOUT_DIVIDER_KEY,
        type: InAdminHeaderUserMenuItemType.Divider,
        label: "",
        disabled: false,
      });
    }
    result.push(item);
  }
  return result;
};
