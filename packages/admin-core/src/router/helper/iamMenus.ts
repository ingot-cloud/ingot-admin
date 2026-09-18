import type { MenuTreeNode } from "@/models/menu";
import { MenuType } from "@/models/enums";
import type { IamMenuNode } from "@/models/iam";

export function mapIamMenus(nodes: IamMenuNode[] | undefined | null): MenuTreeNode[] {
  if (!nodes?.length) {
    return [];
  }
  return nodes.map((node) => ({
    id: node.id,
    appId: node.applicationId,
    name: node.name,
    menuType: node.kind === "DIRECTORY" ? MenuType.Directory : MenuType.Menu,
    path: node.path,
    viewPath: node.viewPath,
    routeName: node.routeName,
    icon: node.icon,
    sort: node.sortOrder,
    children: mapIamMenus(node.children),
  }));
}
