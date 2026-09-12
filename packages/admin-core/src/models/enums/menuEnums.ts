import { newTagText } from "../common";
import { toEnumExtArray, useEnum } from "../../hooks/biz/useEnum";

export enum MenuType {
  Directory = "0",
  Menu = "1",
}

/** 后端已不再返回按钮节点，路由转换仍忽略该历史取值。 */
export const LEGACY_MENU_TYPE_BUTTON = "9";

export const MenuTypeEnumExtArray = toEnumExtArray(MenuType, [
  newTagText("目录", "success"),
  newTagText("菜单", "warning"),
]);
export const useMenuTypeEnum = () => {
  return useEnum(MenuTypeEnumExtArray);
};
export function getMenuTypeIcon(type: MenuType | string | undefined): string {
  switch (type) {
    case MenuType.Directory:
      return "octicon:file-directory-16";
    case MenuType.Menu:
      return "material-symbols:menu";
    default:
      return "material-symbols:menu";
  }
}

export enum MenuLinkType {
  Default = "0",
  IFrame = "1",
  External = "2",
}
export const MenuLinkTypeEnumExtArray = toEnumExtArray(MenuLinkType, [
  newTagText("正常链接", "success"),
  newTagText("内嵌链接", "warning"),
  newTagText("外部链接", "danger"),
]);
export const useMenuLinkTypeEnum = () => {
  return useEnum(MenuLinkTypeEnumExtArray);
};

export enum PermissionMatchModeEnum {
  Any = "0",
  All = "1",
}

export const PermissionMatchModeEnumExtArray = toEnumExtArray(PermissionMatchModeEnum, [
  newTagText("任一权限", "success"),
  newTagText("全部权限", "warning"),
]);

export const usePermissionMatchModeEnum = () => {
  return useEnum(PermissionMatchModeEnumExtArray);
};
