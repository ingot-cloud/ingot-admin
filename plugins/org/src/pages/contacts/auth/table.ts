import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import type { BizPermissionTreeNodeVO } from "@/models";

export const ORG_AUTH_TABLE_ID = "org-contacts-auth";
export const ORG_AUTH_SPLIT_KEY = "org-contacts-auth";

export const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "权限",
    prop: "code",
    required: true,
  },
];

export function createOrgAuthToolbarActions(
  canEdit: boolean,
  onEdit: () => void,
): Array<InTableAction<BizPermissionTreeNodeVO>> {
  if (!canEdit) {
    return [];
  }
  return [
    {
      key: "edit",
      label: "编辑权限",
      kind: "quick",
      overflow: "never",
      priority: 50,
      onSelect: () => onEdit(),
    },
  ];
}
