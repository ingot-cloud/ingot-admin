/**
 * 导航菜单Item
 */
export interface MenuRouteRecord {
  /** IAM 菜单所属应用，侧栏隔离和深链接同步使用。 */
  applicationId?: string;
  path: string;
  title?: string;
  icon?: string;
  children?: Array<MenuRouteRecord>;
}
