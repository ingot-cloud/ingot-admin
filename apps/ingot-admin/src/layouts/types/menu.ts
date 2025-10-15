/**
 * 导航菜单Item
 */
export interface MenuRouteRecord {
  path: string;
  title?: string;
  icon?: string;
  children?: Array<MenuRouteRecord>;
}
