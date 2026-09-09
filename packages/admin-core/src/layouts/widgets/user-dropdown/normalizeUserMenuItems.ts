import {
  InAdminHeaderBuiltinUserMenuName,
  InAdminHeaderItemType,
} from "@/plugin/header";
import type { ResolvedHeaderUserMenuItem } from "../header/resolveHeaderConfig";

export const USER_MENU_LOGOUT_DIVIDER_KEY = "in-user-logout-divider";

const isLogout = (item: ResolvedHeaderUserMenuItem): boolean =>
  item.type === InAdminHeaderItemType.Builtin &&
  item.name === InAdminHeaderBuiltinUserMenuName.Logout;

const collapseDividers = (
  items: ResolvedHeaderUserMenuItem[],
): ResolvedHeaderUserMenuItem[] => {
  const result: ResolvedHeaderUserMenuItem[] = [];
  for (const item of items) {
    if (
      item.type === InAdminHeaderItemType.Divider &&
      result[result.length - 1]?.type === InAdminHeaderItemType.Divider
    ) {
      continue;
    }
    result.push(item);
  }
  while (result[0]?.type === InAdminHeaderItemType.Divider) {
    result.shift();
  }
  while (result[result.length - 1]?.type === InAdminHeaderItemType.Divider) {
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
      result[result.length - 1]?.type !== InAdminHeaderItemType.Divider
    ) {
      result.push({
        key: USER_MENU_LOGOUT_DIVIDER_KEY,
        type: InAdminHeaderItemType.Divider,
        label: "",
        disabled: false,
      });
    }
    result.push(item);
  }
  return result;
};
