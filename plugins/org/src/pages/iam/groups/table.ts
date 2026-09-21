import type { InTableAction, TableHeaderRecord } from "@ingot/admin-core";
import {
  IamAction,
  objectActionAllowed,
  type ResourceDetail,
  type GroupRecord,
} from "@ingot/admin-common";

export const TABLE_ID = "org-iam-groups";
export type Row = ResourceDetail<GroupRecord>;

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: "名称", prop: "name", required: true },
  { label: "有效人数", prop: "visibleMemberCount" },
  { label: "操作", width: "160", prop: "actions", fixed: "right" },
];

export function createToolbarActions(onCreate: () => void): Array<InTableAction<Row>> {
  return [
    {
      key: "create",
      label: "创建用户组",
      kind: "quick",
      overflow: "never",
      priority: 50,
      permission: IamAction.TENANT_GROUP_CREATE,
      onSelect: () => onCreate(),
    },
  ];
}

export function createRowActions(
  row: Row,
  handlers: { onDetail: (row: Row) => void; onDelete: (row: Row) => void },
): Array<InTableAction<Row>> {
  const detail = objectActionAllowed(row.capabilities, IamAction.TENANT_GROUP_READ);
  const remove = objectActionAllowed(row.capabilities, IamAction.TENANT_GROUP_DELETE);
  return [
    {
      key: "detail",
      label: "详情",
      kind: "detail",
      permission: IamAction.TENANT_GROUP_READ,
      disabled: !detail.allowed,
      disabledReason: detail.message,
      onSelect: handlers.onDetail,
    },
    {
      key: "delete",
      label: "删除",
      kind: "danger",
      permission: IamAction.TENANT_GROUP_DELETE,
      disabled: !remove.allowed,
      disabledReason: remove.message,
      onSelect: handlers.onDelete,
    },
  ];
}
