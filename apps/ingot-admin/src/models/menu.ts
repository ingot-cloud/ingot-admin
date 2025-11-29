import type { CommonStatus } from "./enums";

export interface MenuTreeNode extends MetaMenu {
  children?: Array<MenuTreeNode>;
}

export interface MetaMenu {
  id?: string;
  pid?: string;
  name?: string;
  menuType?: string;
  path?: string;
  enablePermission?: boolean;
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
}

export interface MenuFilterDTO extends MetaMenu {
  orgTypeText?: string;
}
