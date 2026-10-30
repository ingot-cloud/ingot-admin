import type { MenuRouteRecord } from "@ingot/admin-core";

/** 菜单未配置图标时的统一占位，不按业务路径维护图标映射。 */
export const WORKBENCH_FALLBACK_ICON = "ep:menu";

export const WORKBENCH_METRICS = [
  { key: "memberCount", label: "在册成员", description: "含暂停成员，不含已移出成员" },
  { key: "departmentCount", label: "部门", description: "不含组织根节点" },
  { key: "groupCount", label: "用户组", description: "当前组织用户组" },
  { key: "applicationCount", label: "可用应用", description: "当前身份可进入的应用" },
] as const;

export interface WorkbenchEntry {
  path: string;
  title: string;
  icon?: string;
  applicationId?: string;
  ancestors: string[];
}

/** 消费已经过隐藏、目录与授权过滤的导航，保留菜单元数据和原始顺序。 */
export function workbenchEntries(menus: MenuRouteRecord[], currentPath: string): WorkbenchEntry[] {
  const result: WorkbenchEntry[] = [];
  const seen = new Set<string>();
  const visit = (nodes: MenuRouteRecord[], ancestors: string[], applicationId?: string): void => {
    for (const node of nodes) {
      const title = node.title?.trim() ?? "";
      const appId = node.applicationId ?? applicationId;
      if (node.children?.length) {
        visit(node.children, title ? [...ancestors, title] : ancestors, appId);
        continue;
      }
      if (!node.path || !title || node.path === currentPath || seen.has(node.path)) continue;
      seen.add(node.path);
      result.push({ path: node.path, title, icon: node.icon, applicationId: appId, ancestors });
    }
  };
  visit(menus, []);
  return result;
}
