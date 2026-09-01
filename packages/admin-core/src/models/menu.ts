import type { CommonStatus } from "./enums";

export interface MenuTreeNode extends PlatformMenu {
  children?: Array<MenuTreeNode>;
}

export interface PlatformMenu {
  id?: string;
  appId?: string;
  appCode?: string;
  pid?: string;
  name?: string;
  menuType?: string;
  path?: string;
  accessMode?: string;
  permissionId?: string;
  permissionCode?: string;
  routeName?: string;
  customViewPath?: boolean;
  viewPath?: string;
  redirect?: string;
  icon?: string;
  sort?: number;
  isCache?: boolean;
  hidden?: boolean;
  hideBreadcrumb?: boolean;
  props?: boolean;
  orgType?: string;
  linkType?: string;
  linkUrl?: string;
  status?: CommonStatus;
  remark?: string;
}

export interface MenuFilterDTO extends PlatformMenu {
  orgTypeText?: string;
}
