import { newTagText } from "../common";

export enum MenuType {
  Directory = "0",
  Menu = "1",
  Button = "9",
}
export const MenuTypeEnumExtArray = toEnumExtArray(MenuType, [
  newTagText("目录", "success"),
  newTagText("菜单", "warning"),
  newTagText("按钮", "danger"),
]);
export const useMenuTypeEnum = () => {
  return useEnum(MenuTypeEnumExtArray);
};
export function getMenuTypeIcon(type: MenuType): string {
  switch (type) {
    case MenuType.Directory:
      return "octicon:file-directory-16";
    case MenuType.Menu:
      return "material-symbols:menu";
    case MenuType.Button:
      return "mdi:button-outline";
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
