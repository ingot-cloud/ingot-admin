/**
 * 导航菜单Item
 */
export interface MenuRouteRecord {
  /** IAM 菜单所属应用，侧栏隔离和深链接同步使用。 */
  applicationId?: string;
  /** 服务端正式页面注册键，供已授权菜单与使用说明关联；不构成权限。 */
  viewPath?: string;
  path: string;
  title?: string;
  icon?: string;
  children?: Array<MenuRouteRecord>;
}
