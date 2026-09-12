import type { AppPermissionTreeNodeVO } from "@/models";
import { PermissionNodeTypeEnum } from "@/models/enums";

export interface ActionPermissionOption {
  label: string;
  value: string;
  resourceId?: string;
  code?: string;
}

export const flattenActionPermissions = (
  nodes: Array<AppPermissionTreeNodeVO> | undefined,
): Array<ActionPermissionOption> => {
  const result: Array<ActionPermissionOption> = [];
  const walk = (list: Array<AppPermissionTreeNodeVO>): void => {
    list.forEach((item) => {
      if (item.nodeType === PermissionNodeTypeEnum.Action && item.id && !item.code?.includes("*")) {
        result.push({
          label: item.code ? `${item.name}（${item.code}）` : (item.name ?? item.id),
          value: item.id,
          resourceId: item.resourceId,
          code: item.code,
        });
      }
      if (item.children?.length) {
        walk(item.children);
      }
    });
  };
  walk(nodes ?? []);
  return result;
};

export const isAppRootPermission = (row: { pid?: string; code?: string }): boolean => {
  const rootPid = !row.pid || row.pid === "0";
  return rootPid && Boolean(row.code?.endsWith(":**"));
};
